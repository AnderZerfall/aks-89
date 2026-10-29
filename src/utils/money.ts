import { dinero, toSnapshot } from "dinero.js";
import * as currencies from "dinero.js/currencies";

export const Money = {
  toMinorUnits: (amount: number, currencyCode: string): number => {
    if (!Number.isFinite(amount)) {
      throw new Error(`Invalid amount: ${amount}`);
    }

    const code = currencyCode.toUpperCase() as keyof typeof currencies;
    const currency = currencies[code];
    if (!currency) {
      throw new Error(`Unsupported currency code: ${currencyCode}`);
    }

    const minorUnitAmount = Math.round(
      amount * currency.base ** currency.exponent,
    );
    if (!Number.isSafeInteger(minorUnitAmount)) {
      throw new Error(`Amount is outside the supported range: ${amount}`);
    }

    return toSnapshot(
      dinero({
        amount: minorUnitAmount,
        currency,
      }),
    ).amount;
  },
};
