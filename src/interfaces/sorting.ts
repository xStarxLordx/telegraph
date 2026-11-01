/** Anything listed newest first: the id breaks ties so the order is stable across pages. */
export interface NewestSortable {
  id: string;
  /** A Date, or an ISO string as the mock database stores it. */
  createdAt: Date | string;
}

/** Anything listed alphabetically: the username breaks ties. */
export interface NameSortable {
  fullName: string;
  username: string | null;
}
