import { ProductCategory } from "../types/constants/product.js";

const OLX_TO_USPACY_CATEGORY_MAP: Record<number, ProductCategory> = {
  1757: ProductCategory.FlatSell, // Квартири
  1754: ProductCategory.FlatSell, // Кімнати
  3709: ProductCategory.FlatRent, // Житло подобово
  206: ProductCategory.HouseSell, // Будинки
  1610: ProductCategory.CommercialSell, // Комерційна нерухомість
  1606: ProductCategory.CommercialSell, // Земля
  1616: ProductCategory.CommercialSell, // Гаражі, парковки
  1522: ProductCategory.FlatSell, // Нерухомість за кордоном
};

export const OlxUspacyCategoryMapper = {
  toUspacy,
};

function toUspacy(categoryId: number): ProductCategory {
  return OLX_TO_USPACY_CATEGORY_MAP[categoryId] ?? ProductCategory.FlatSell;
}
