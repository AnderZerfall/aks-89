import { OlxService } from "./olx-service.js";
import { OlxSyncStateService } from "./olx-sync-state-service.js";
import { UspacyService } from "./uspacy-service.js";
import type { Product } from "../types/domain/product.js";
import type { OlxAdvert } from "../types/dto/olx/olx-adverts.dto.js";
import type { OlxMessageResponseDto } from "../types/dto/olx/olx-message.dto.js";
import type {
  OlxContactPayload,
  UspacyContact,
} from "../types/domain/uspacy-olx-lead.js";
import { OlxMessage } from "../types/constants/olx.js";
import { Logger } from "../utils/logger.js";

const THREAD_PAGE_SIZE = 100;
const MAX_THREAD_PAGES = 20;
const OLX_LEAD_SOURCE = "OLX";
const EMPTY_STRING = "";
const COMMENT_SEPARATOR = "\n\n";
const LEAD_TITLE_PREFIX = "Запит з OLX: ";
const MISSING_PRODUCT_TITLE_PREFIX = "Оголошення ";
const OLX_BUYER_TITLE_PREFIX = "OLX buyer ";
const PRODUCT_REFERENCE_PREFIX = "Uspacy product: ";
const PRODUCT_ID_LABEL = " (ID: ";
const PRODUCT_LINK_SEPARATOR = " — ";
const ADVERT_REFERENCE_PREFIX = "OLX advert: ";
const ADVERT_ID_REFERENCE_PREFIX = "OLX advert ID: ";
const FIRST_BUYER_MESSAGE_LABEL = "First buyer message: ";
const ADVERT_REFERENCE = (url: string) => `${ADVERT_REFERENCE_PREFIX}${url}`;
const ADVERT_ID_REFERENCE = (advertId: number) =>
  `${ADVERT_ID_REFERENCE_PREFIX}${advertId}`;
const PRODUCT_REFERENCE = (product: Product) =>
  `${PRODUCT_REFERENCE_PREFIX}${product.title}${PRODUCT_ID_LABEL}${product.id})${
    product.link ? `${PRODUCT_LINK_SEPARATOR}${product.link}` : EMPTY_STRING
  }`;
const OLX_BUYER_TITLE = (interlocutorId: number) =>
  `${OLX_BUYER_TITLE_PREFIX}${interlocutorId}`;
const THREAD_PAGE_LIMIT_WARNING = "OLX thread polling reached its page limit";
const THREAD_SKIP_INFO = "Skipping OLX thread without an incoming message";
const THREAD_FAILURE_ERROR = "Failed to process OLX buyer thread";
const MISSING_PRODUCT_WARNING = "OLX advert has no matching Uspacy product";
const LEAD_CREATED_INFO = "Created Uspacy Lead from OLX buyer thread";
const BUYER_EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const BUYER_PHONE_CANDIDATES_PATTERN = /(?:\+?\d[\d\s().-]{5,}\d)/g;
const NON_DIGIT_PATTERN = /\D/g;
const NUMERIC_ID_PATTERN = /^\d+$/;
const PLUS_PREFIX_PATTERN = /^\+/;
const PLUS_PREFIX = "+";
const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;

enum OlxBuyerPhoneType {
  Work = "WORK",
}

enum OlxBuyerEmailType {
  Main = "main",
}

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

export async function syncOlxBuyerMessages(): Promise<OlxLeadSyncCounts> {
  const accessToken = await OlxService.refreshTokens();
  const [adverts, products] = await Promise.all([
    OlxService.getPosts(accessToken),
    UspacyService.getRecentProducts(),
  ]);
  const counts: OlxLeadSyncCounts = {
    threads: 0,
    leadsCreated: 0,
    skipped: 0,
    failed: 0,
  };

  await syncThreadPages({ accessToken, adverts, products, counts });
  Logger.info("OLX buyer-message sync completed", counts);
  return counts;
}

async function syncThreadPages({
  accessToken,
  adverts,
  products,
  counts,
}: {
  accessToken: string;
  adverts: OlxAdvert[];
  products: Product[];
  counts: OlxLeadSyncCounts;
}): Promise<void> {
  for (let page = 0; page < MAX_THREAD_PAGES; page++) {
    const threads = await OlxService.getThreads({
      accessToken,
      offset: page * THREAD_PAGE_SIZE,
      limit: THREAD_PAGE_SIZE,
    });
    counts.threads += threads.length;
    Logger.info("Retrieved OLX buyer threads", {
      offset: page * THREAD_PAGE_SIZE,
      limit: THREAD_PAGE_SIZE,
      threadCount: threads.length,
    });

    await processThreadPage({ threads, accessToken, adverts, products, counts });

    if (threads.length < THREAD_PAGE_SIZE) return;
  }

  Logger.warn(THREAD_PAGE_LIMIT_WARNING, {
    maxPages: MAX_THREAD_PAGES,
  });
}

async function processThreadPage({
  threads,
  accessToken,
  adverts,
  products,
  counts,
}: {
  threads: Awaited<ReturnType<typeof OlxService.getThreads>>;
  accessToken: string;
  adverts: OlxAdvert[];
  products: Product[];
  counts: OlxLeadSyncCounts;
}): Promise<void> {
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
      Logger.error(THREAD_FAILURE_ERROR, {
        threadUuid: thread.uuid,
        advertId: thread.advertId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
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
  if (await OlxSyncStateService.hasProcessedOlxThread(threadUuid)) {
    Logger.info("Skipping previously processed OLX thread", { threadUuid });
    return false;
  }
  if (!(await OlxSyncStateService.claimOlxThread(threadUuid))) {
    Logger.info("Skipping OLX thread claimed by another run", { threadUuid });
    return false;
  }

  let processed = false;
  try {
    const messages = await OlxService.getMessages({ accessToken, threadUuid });
    const firstBuyerMessage = findFirstBuyerMessage(messages);
    if (!firstBuyerMessage) {
      Logger.info(THREAD_SKIP_INFO, {
        threadUuid,
      });
      return false;
    }

    const buyerDetails = extractBuyerDetails(firstBuyerMessage.text);
    const contact = await getOrCreateContact(interlocutorId, buyerDetails);
    const advert = adverts.find((item) => item.id === advertId);
    const product = findProduct(products, advertId, advert?.externalId);
    const productTitle =
      product?.title ??
      advert?.title ??
      `${MISSING_PRODUCT_TITLE_PREFIX}${advertId}`;
    const productReference = product
      ? PRODUCT_REFERENCE(product)
      : ADVERT_ID_REFERENCE(advertId);
    const advertReference = advert?.url
      ? ADVERT_REFERENCE(advert.url)
      : ADVERT_ID_REFERENCE(advertId);
    if (!product) {
      Logger.warn(MISSING_PRODUCT_WARNING, {
        threadUuid,
        advertId,
      });
    }

    await UspacyService.createOlxLead({
      payload: {
        title: `${LEAD_TITLE_PREFIX}${productTitle}`,
        source: OLX_LEAD_SOURCE,
        comments: [
          `${FIRST_BUYER_MESSAGE_LABEL}${firstBuyerMessage.text}`,
          productReference,
          advertReference,
        ].join(COMMENT_SEPARATOR),
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
    processed = true;
    Logger.info(LEAD_CREATED_INFO, {
      threadUuid,
      advertId,
      contactId: contact.id,
      productId: product?.id,
    });
    return true;
  } finally {
    if (!processed) {
      await OlxSyncStateService.releaseOlxThreadClaim(threadUuid);
    }
  }
}

function findFirstBuyerMessage(
  messages: OlxMessageResponseDto,
): OlxMessageResponseDto[number] | undefined {
  return messages
    .filter((message) => message.type === OlxMessage.Received)
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
      id: NUMERIC_ID_PATTERN.test(storedContactId)
        ? Number(storedContactId)
        : storedContactId,
      title: OLX_BUYER_TITLE(interlocutorId),
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
    title: OLX_BUYER_TITLE(interlocutorId),
    source: OLX_LEAD_SOURCE,
    ...(details.phone
      ? {
          phone: [
            {
              id: EMPTY_STRING,
              type: OlxBuyerPhoneType.Work,
              value: details.phone,
            },
          ],
        }
      : {}),
    ...(details.email
      ? {
          email: [
            {
              id: EMPTY_STRING,
              type: OlxBuyerEmailType.Main,
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
  const email = message.match(BUYER_EMAIL_PATTERN)?.[0];
  const phoneCandidates = message.match(BUYER_PHONE_CANDIDATES_PATTERN) ?? [];
  const phone = phoneCandidates
    .map((candidate) => {
      const digits = candidate.replace(NON_DIGIT_PATTERN, EMPTY_STRING);
      if (
        digits.length < MIN_PHONE_DIGITS ||
        digits.length > MAX_PHONE_DIGITS
      ) {
        return undefined;
      }
      return `${
        PLUS_PREFIX_PATTERN.test(candidate.trim()) ? PLUS_PREFIX : EMPTY_STRING
      }${digits}`;
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
