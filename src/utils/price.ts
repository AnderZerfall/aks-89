import { dinero, toSnapshot } from "dinero.js";
import * as currencies from "dinero.js/currencies";

export const Price = {
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
  fromMinorUnits: (
    amount: number,
    currencyCode: string,
  ): { value: number; currency: string } => {
    if (!Number.isSafeInteger(amount)) {
      throw new Error(`Invalid minor-unit amount: ${amount}`);
    }

    const code = currencyCode.toUpperCase() as keyof typeof currencies;
    const currency = currencies[code];
    if (!currency) {
      throw new Error(`Unsupported currency code: ${currencyCode}`);
    }

    return {
      value: amount / currency.base ** currency.exponent,
      currency: currency.code,
    };
  },
};
