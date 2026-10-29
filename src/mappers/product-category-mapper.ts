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

const USPACY_TO_OLX_CATEGORY_MAP: Record<ProductCategory, number> = {
  [ProductCategory.FlatSell]: 1757, // Квартири (потрапляє в загальну категорію)
  [ProductCategory.FlatRent]: 1757, // Оренда квартир (категорія 1757, тип угоди регулюється атрибутом/контентом)
  [ProductCategory.HouseSell]: 206, // Будинки
  [ProductCategory.HouseRent]: 206, // Оренда будинків (категорія 206, тип угоди регулюється атрибутом/контентом)
  [ProductCategory.CommercialSell]: 1610, // Комерційна нерухомість
  [ProductCategory.CommercialRent]: 1610, // Оренда комерційної нерухомості (категорія 1610)
};

export const ProductCategoryMapper = {
  toUspacy,
  toOlx,
  hasUspacyMapping: (categoryId: number) =>
    Object.hasOwn(OLX_TO_USPACY_CATEGORY_MAP, categoryId),
};

function toUspacy(categoryId: number): ProductCategory {
  const category = OLX_TO_USPACY_CATEGORY_MAP[categoryId];
  if (!category) {
    throw new Error(`Unsupported OLX category ID: ${categoryId}`);
  }

  return category;
}

function toOlx(category: ProductCategory): number {
  const olxCategoryId = USPACY_TO_OLX_CATEGORY_MAP[category];
  if (!olxCategoryId) {
    throw new Error(`Unable to map Uspacy category: ${category}`);
  }

  return olxCategoryId;
}
