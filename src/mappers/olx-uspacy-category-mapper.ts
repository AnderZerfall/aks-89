import { ProductCategory } from "../types/constants/product.js";

const OLX_TO_USPACY_CATEGORY_MAP: Record<number, ProductCategory> = {
  1757: ProductCategory.FlatSell, // Квартири
  1754: ProductCategory.FlatSell, // Кімнати
  1758: ProductCategory.FlatSell, // Продаж квартир
  3709: ProductCategory.FlatRent, // Житло подобово
  206: ProductCategory.HouseSell, // Будинки
  1602: ProductCategory.HouseSell, // Продаж будинків
  1608: ProductCategory.CommercialSell, // Продаж землі
  1610: ProductCategory.CommercialSell, // Комерційна нерухомість
  1606: ProductCategory.CommercialSell, // Земля
  1616: ProductCategory.CommercialSell, // Гаражі, парковки
  1522: ProductCategory.FlatSell, // Нерухомість за кордоном
};

export const OlxUspacyCategoryMapper = {
  toUspacy,
};

function toUspacy(categoryId: number): ProductCategory {
  const category = OLX_TO_USPACY_CATEGORY_MAP[categoryId];
  if (!category) {
    throw new Error(`Unsupported OLX category ID: ${categoryId}`);
  }

  return category;
}
