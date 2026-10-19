export enum EntityType {
  Leads = "leads",
  Deals = "deals",
  Contacts = "contacts",
  Companies = "companies",
}

export type Entity = {
  title: string;
  tableName: EntityType;
  type: EntityType;
  sort: number;
};

export type CreateEntityRequest = {};

export type UpdateEntityRequest = {};
