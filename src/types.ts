export interface Proceeding {
  number: number;
  title: string;
  dates: string[];
  isCurrent: boolean;
}

export interface Committee {
  code: string;
  name: string;
  nameGenitive: string;
}

export interface JointPartner {
  code: string;
  num: number;
}

export interface CommitteeSitting {
  code: string;
  num: number;
  date: string;
  start: string | null;
  end: string | null;
  room: string;
  status: string;
  notes: string;
  agendaHtml: string;
  isClosed: boolean;
  isRemote: boolean;
  jointWith: JointPartner[];
}

export interface Parsed<Item> {
  items: Item[];
  invalid: Invalid[];
}

export interface Invalid {
  record: unknown;
  reason: string;
}

export interface Meeting {
  sitting: CommitteeSitting;
  codes: string[];
}

export type GetJson = (url: string) => Promise<unknown>;

export type OnInvalid = (invalid: Invalid) => void;

export interface SejmScheduleOptions {
  term?: number;
  baseUrl?: string;
  getJson?: GetJson;
  onInvalid?: OnInvalid;
}

export interface SittingsOptions {
  cancelled?: boolean;
}

export type Read<Item> = { item: Item } | { reason: string };
