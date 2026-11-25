/** A plenary sitting of the Sejm. */
export interface Proceeding {
  /** Ordinal of the sitting. `0` while it is planned and has no number yet, so never use it as a key. */
  number: number;
  title: string;
  /** Days the sitting runs, as `YYYY-MM-DD`, sorted ascending. Never empty. */
  dates: string[];
  /** True for the sitting the API marks as under way. */
  isCurrent: boolean;
}

/** A committee of the Sejm. Subcommittees (e.g. `ENM02S`) are not listed. */
export interface Committee {
  /** Short code, e.g. `ENM`. */
  code: string;
  /** Name in Polish, in the nominative. */
  name: string;
  /** Name in Polish, in the genitive. Empty string if the API gave none. */
  nameGenitive: string;
}

/** Another committee sitting held jointly with a sitting. */
export interface JointPartner {
  code: string;
  /** The sitting number within that committee. */
  num: number;
}

/** A sitting of one committee. `code` + `num` identify it. */
export interface CommitteeSitting {
  code: string;
  num: number;
  /** Day of the sitting, `YYYY-MM-DD`. */
  date: string;
  /** Start time as `HH:MM` (as written by the API, no timezone conversion), or `null`. */
  start: string | null;
  /** End time as `HH:MM`, or `null`. */
  end: string | null;
  /** Empty string if unknown. */
  room: string;
  /** Free text from the API (e.g. `PLANNED`); use `isCancelled()` to test for cancellation. */
  status: string;
  notes: string;
  /** Agenda as raw HTML from the API. Empty for a closed sitting that has none. Not sanitised. */
  agendaHtml: string;
  isClosed: boolean;
  isRemote: boolean;
  /** Other sittings held jointly with this one. Empty if none. */
  jointWith: JointPartner[];
}

/** Result of a parser: the records that were read, and those that were left out. */
export interface Parsed<Item> {
  items: Item[];
  invalid: Invalid[];
}

/** A record that was left out because it made no sense. */
export interface Invalid {
  /** The raw record as the API sent it. */
  record: unknown;
  /** Human-readable explanation. */
  reason: string;
}

/** A sitting after joint sittings are merged. */
export interface Meeting {
  /** The sitting that was kept for the meeting. */
  sitting: CommitteeSitting;
  /** Codes of all the committees taking part, the host's first. */
  codes: string[];
}

/** Fetches `url` and returns the parsed JSON. Throw `SejmApiError` on failure. */
export type GetJson = (url: string) => Promise<unknown>;

/** Called once for every record that was left out. */
export type OnInvalid = (invalid: Invalid) => void;

export interface SejmScheduleOptions {
  /** Term of the Sejm. Defaults to 10. */
  term?: number;
  /** Defaults to `https://api.sejm.gov.pl`. */
  baseUrl?: string;
  /** Custom transport, for pacing, retries or caching. Defaults to `fetch`. */
  getJson?: GetJson;
  onInvalid?: OnInvalid;
}

export interface SittingsOptions {
  /** Also return cancelled sittings. Defaults to false. */
  cancelled?: boolean;
}

export type Read<Item> = { item: Item } | { reason: string };
