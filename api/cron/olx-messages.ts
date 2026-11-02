import { OlxService } from "../../src/services/olx-service.js";
import { OlxSyncStateService } from "../../src/services/olx-sync-state-service.js";
import { UspacyService } from "../../src/services/uspacy-service.js";
import type { Product } from "../../src/types/domain/product.js";
import type { OlxContactPayload, UspacyContact } from "../../src/types/domain/uspacy-olx-lead.js";
import type { OlxAdvert } from "../../src/types/dto/olx/olx-adverts.dto.js";
import type { OlxMessageResponseDto } from "../../src/types/dto/olx/olx-message.dto.js";
import { createHandler } from "../../src/utils/create-handler.js";
import { Logger } from "../../src/utils/logger.js";

const THREAD_PAGE_SIZE = 100;
const MAX_THREAD_PAGES = 20;

type OlxLeadSyncCounts = {
  threads: number;
  leadsCreated: number;
  skipped: number;
  failed: number;
};

type BuyerDetails = {
  phone?: string;
  email?: string;
};

async function syncOlxBuyerMessages(): Promise<OlxLeadSyncCounts> {
  const accessToken = await OlxService.refreshTokens();
  const adverts = await OlxService.getPosts(accessToken);
  const products = await UspacyService.getRecentProducts();
  const counts: OlxLeadSyncCounts = {
    threads: 0,
    leadsCreated: 0,
    skipped: 0,
    failed: 0,
  };

  for (let page = 0; page < MAX_THREAD_PAGES; page++) {
    const offset = page * THREAD_PAGE_SIZE;
    const threads = await OlxService.getThreads({
      accessToken,
      offset,
      limit: THREAD_PAGE_SIZE,
    });
    counts.threads += threads.length;

    for (const thread of threads) {
      try {
        const created = await processThread({
          accessToken,
          threadUuid: thread.uuid,
          advertId: thread.advertId,
          interlocutorId: thread.interlocutorId,
          adverts,
          products,
        });
        if (created) counts.leadsCreated++;
        else counts.skipped++;
      } catch (error) {
        counts.failed++;
        Logger.error("Failed to process OLX buyer thread", {
          threadUuid: thread.uuid,
          advertId: thread.advertId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (threads.length < THREAD_PAGE_SIZE) return counts;
  }

  Logger.warn("OLX thread polling reached its page limit", {
    maxPages: MAX_THREAD_PAGES,
  });
  return counts;
}

async function processThread({
  accessToken,
  threadUuid,
  advertId,
  interlocutorId,
  adverts,
  products,
}: {
  accessToken: string;
  threadUuid: string;
  advertId: number;
  interlocutorId: number;
  adverts: OlxAdvert[];
  products: Product[];
}): Promise<boolean> {
  if (await OlxSyncStateService.hasProcessedOlxThread(threadUuid)) return false;
  if (!(await OlxSyncStateService.claimOlxThread(threadUuid))) return false;

  const messages = await OlxService.getMessages({ accessToken, threadUuid });
  const firstBuyerMessage = findFirstBuyerMessage(messages);
  if (!firstBuyerMessage) {
    Logger.info("Skipping OLX thread without an incoming message", {
      threadUuid,
    });
    return false;
  }

  const buyerDetails = extractBuyerDetails(firstBuyerMessage.text);
  const contact = await getOrCreateContact(interlocutorId, buyerDetails);
  const advert = adverts.find((item) => item.id === advertId);
  const product = findProduct(products, advertId, advert?.externalId);
  const productTitle =
    product?.title ?? advert?.title ?? `Оголошення ${advertId}`;
  const productReference = product
    ? `Uspacy product: ${product.title} (ID: ${product.id})${
        product.link ? ` — ${product.link}` : ""
      }`
    : `OLX advert ID: ${advertId}`;
  const advertReference = advert?.url
    ? `OLX advert: ${advert.url}`
    : `OLX advert ID: ${advertId}`;
  if (!product) {
    Logger.warn("OLX advert has no matching Uspacy product", {
      threadUuid,
      advertId,
    });
  }

  await UspacyService.createOlxLead({
    payload: {
      title: `Запит з OLX: ${productTitle}`,
      source: "OLX",
      comments: [
        `First buyer message: ${firstBuyerMessage.text}`,
        productReference,
        advertReference,
      ].join("\n\n"),
      contacts: [
        {
          id: contact.id,
          title: contact.title,
          ...(contact.owner === undefined ? {} : { owner: contact.owner }),
          entityReferenceType: true,
        },
      ],
    },
  });

  await OlxSyncStateService.markOlxThreadProcessed(threadUuid);
  Logger.info("Created Uspacy Lead from OLX buyer thread", {
    threadUuid,
    advertId,
    contactId: contact.id,
    productId: product?.id,
  });
  return true;
}

function findFirstBuyerMessage(
  messages: OlxMessageResponseDto,
): OlxMessageResponseDto[number] | undefined {
  return messages
    .filter((message) => message.type === "received")
    .sort((left, right) => {
      const leftTime = Date.parse(left.createdAt);
      const rightTime = Date.parse(right.createdAt);
      return (
        (Number.isNaN(leftTime) ? 0 : leftTime) -
        (Number.isNaN(rightTime) ? 0 : rightTime)
      );
    })[0];
}

async function getOrCreateContact(
  interlocutorId: number,
  details: BuyerDetails,
): Promise<UspacyContact> {
  const storedContactId = await OlxSyncStateService.getOlxContactId(
    interlocutorId,
  );
  if (storedContactId) {
    return {
      id: /^\d+$/.test(storedContactId)
        ? Number(storedContactId)
        : storedContactId,
      title: `OLX buyer ${interlocutorId}`,
    };
  }

  const existingContact = await UspacyService.searchOlxContact(details);
  if (existingContact) {
    await OlxSyncStateService.saveOlxContactId(
      interlocutorId,
      String(existingContact.id),
    );
    return existingContact;
  }

  const payload: OlxContactPayload = {
    title: `OLX buyer ${interlocutorId}`,
    source: "OLX",
    ...(details.phone
      ? {
          phone: [
            {
              id: "",
              type: "WORK",
              value: details.phone,
            },
          ],
        }
      : {}),
    ...(details.email
      ? {
          email: [
            {
              id: "",
              type: "main",
              value: details.email,
              main: true,
            },
          ],
        }
      : {}),
  };
  const contact = await UspacyService.createOlxContact({ payload });
  await OlxSyncStateService.saveOlxContactId(
    interlocutorId,
    String(contact.id),
  );
  return contact;
}

function extractBuyerDetails(message: string): BuyerDetails {
  const email = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phoneCandidates = message.match(/(?:\+?\d[\d\s().-]{5,}\d)/g) ?? [];
  const phone = phoneCandidates
    .map((candidate) => {
      const digits = candidate.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) return undefined;
      return `${candidate.trim().startsWith("+") ? "+" : ""}${digits}`;
    })
    .find((candidate): candidate is string => candidate !== undefined);

  return {
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
  };
}

function findProduct(
  products: Product[],
  advertId: number,
  externalId: string | null | undefined,
): Product | undefined {
  return products.find(
    (product) =>
      product.article === String(advertId) ||
      (externalId != null && product.article === externalId),
  );
}

export default createHandler(syncOlxBuyerMessages);