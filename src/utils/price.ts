export const Price = {
  getCurrencyExponent: (currencyCode: string): number => {
    try {
      const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode.toUpperCase(),
      });

      return formatter.resolvedOptions().maximumFractionDigits ?? 2;
    } catch (error) {
      return 2;
    }
  },
  toMinorUnits: (amount: number, currencyCode: string): number => {
    const decimals = Price.getCurrencyExponent(currencyCode);
    const factor = Math.pow(10, decimals);

    return Math.round(amount * factor);
  },
  fromMinorUnits: (amountInMinor: number, currencyCode: string): number => {
    const decimals = Price.getCurrencyExponent(currencyCode);
    const factor = Math.pow(10, decimals);

    return (
      Math.round((amountInMinor / factor) * Number.EPSILON * factor) /
      Number.EPSILON /
      factor
    );
  },
};
