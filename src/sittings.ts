import { isDate, isRecord, parseAll, textOf } from '@sejm/read';
import type { CommitteeSitting, JointPartner, Parsed, Read } from '@sejm/types';

const CLOCK = /^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})/;
const CANCELLED = /cancel|odwo/i;

const clockOf = (value: unknown) =>
  typeof value === 'string' ? (CLOCK.exec(value)?.[1] ?? null) : null;

const isPartner = (item: unknown): item is JointPartner =>
  isRecord(item) &&
  typeof item.code === 'string' &&
  typeof item.num === 'number';

const partnersOf = (value: unknown): JointPartner[] =>
  Array.isArray(value)
    ? value
        .filter(isPartner)
        .map((item) => ({ code: item.code, num: item.num }))
    : [];

const read = (record: unknown): Read<CommitteeSitting> => {
  if (
    !isRecord(record) ||
    typeof record.code !== 'string' ||
    typeof record.num !== 'number' ||
    !isDate(record.date)
  ) {
    return { reason: 'a sitting without a code, a number or a day' };
  }

  return {
    item: {
      code: record.code,
      num: record.num,
      date: record.date,
      start: clockOf(record.startDateTime),
      end: clockOf(record.endDateTime),
      room: textOf(record.room),
      status: textOf(record.status),
      notes: textOf(record.notes),
      agendaHtml: typeof record.agenda === 'string' ? record.agenda : '',
      isClosed: record.closed === true,
      isRemote: record.remote === true,
      jointWith: partnersOf(record.jointWith),
    },
  };
};

/** Parses the raw list from `/committees/sittings/{date}`. For when you fetch the data yourself. */
export const parseCommitteeSittings = (
  records: unknown[],
): Parsed<CommitteeSitting> => parseAll({ records, read });

/** True if the sitting's `status` says it was cancelled (English or Polish). */
export const isCancelled = (sitting: Pick<CommitteeSitting, 'status'>) =>
  CANCELLED.test(sitting.status);
