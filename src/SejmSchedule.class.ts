import { parseCommittees } from '@sejm/committees';
import { SejmApiError } from '@sejm/errors';
import { parseProceedings } from '@sejm/proceedings';
import { parseCommitteeSittings } from '@sejm/sittings';
import { fetchJson } from '@sejm/transport';
import type {
  Committee,
  CommitteeSitting,
  GetJson,
  OnInvalid,
  Parsed,
  Proceeding,
  SejmScheduleOptions,
  SittingsOptions,
} from '@sejm/types';

const DEFAULT_TERM = 10;
const DEFAULT_BASE_URL = 'https://api.sejm.gov.pl';

export class SejmSchedule {
  private readonly termUrl: string;
  private readonly getJson: GetJson;
  private readonly onInvalid: OnInvalid | undefined;

  constructor({
    term = DEFAULT_TERM,
    baseUrl = DEFAULT_BASE_URL,
    getJson = fetchJson,
    onInvalid,
  }: SejmScheduleOptions = {}) {
    this.termUrl = `${baseUrl}/sejm/term${term}`;
    this.getJson = getJson;
    this.onInvalid = onInvalid;
  }

  async proceedings(): Promise<Proceeding[]> {
    return this.list({
      url: `${this.termUrl}/proceedings`,
      parse: parseProceedings,
    });
  }

  async currentProceeding(): Promise<Proceeding | null> {
    const proceedings = await this.proceedings();

    return proceedings.find(({ isCurrent }) => isCurrent) ?? null;
  }

  async committees(): Promise<Committee[]> {
    return this.list({
      url: `${this.termUrl}/committees`,
      parse: parseCommittees,
    });
  }

  async committeeSittings(
    date: string,
    { cancelled = false }: SittingsOptions = {},
  ): Promise<CommitteeSitting[]> {
    const query = cancelled ? '?cancelled=true' : '';

    return this.list({
      url: `${this.termUrl}/committees/sittings/${date}${query}`,
      parse: parseCommitteeSittings,
    });
  }

  private async list<Item>({
    url,
    parse,
  }: {
    url: string;
    parse: (records: unknown[]) => Parsed<Item>;
  }): Promise<Item[]> {
    const data = await this.getJson(url);

    if (!Array.isArray(data)) {
      throw new SejmApiError({
        message: `${url} did not answer with a list`,
        url,
        status: null,
      });
    }

    const { items, invalid } = parse(data);

    invalid.forEach((entry) => this.onInvalid?.(entry));

    return items;
  }
}
