export function getStreetFromTitle(text: string): string {
    const match = text.match(/(?:вул\.?|вулиця|просп\.?|проспект|пл\.?|площа|б-р|бульвар)\s+([А-Яа-яA-Za-z0-9\s.,-]+?)(?=[,.\n]|$)/i);
    return match ? match[0].trim() : "Address not provided";
  }