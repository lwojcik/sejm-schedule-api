import { isDate, isRecord, parseAll, textOf } from '@sejm/read';
import type { Parsed, Proceeding, Read } from '@sejm/types';

const read = (record: unknown): Read<Proceeding> => {
  if (!isRecord(record) || !Array.isArray(record.dates)) {
    return { reason: 'a record without a list of dates' };
  }

  const dates = record.dates;

  if (dates.length === 0 || !dates.every(isDate)) {
    return { reason: 'the dates of the proceeding cannot be read' };
  }

  return {
    item: {
      number: Number(record.number) || 0,
      title: textOf(record.title),
      dates: dates.toSorted((first, second) => first.localeCompare(second)),
      isCurrent: record.current === true,
    },
  };
};

/** Parses the raw list from `/proceedings`. For when you fetch the data yourself. */
export const parseProceedings = (records: unknown[]): Parsed<Proceeding> =>
  parseAll({ records, read });
