import type { Invalid, Parsed, Read } from '@sejm/types';

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const textOf = (value: unknown) =>
  typeof value === 'string' ? value.replaceAll(/\s+/g, ' ').trim() : '';

export const isDate = (value: unknown): value is string => {
  const match = typeof value === 'string' ? DATE.exec(value) : null;

  if (!match) {
    return false;
  }

  const day = new Date(`${value as string}T00:00:00Z`);

  return (
    !Number.isNaN(day.getTime()) &&
    day.toISOString().startsWith(value as string)
  );
};

export const parseAll = <Item>({
  records,
  read,
}: {
  records: unknown[];
  read: (record: unknown) => Read<Item>;
}): Parsed<Item> => {
  const results = records.map((record) => ({ record, result: read(record) }));

  return {
    items: results.flatMap(({ result }) =>
      'item' in result ? [result.item] : [],
    ),
    invalid: results.flatMap(({ record, result }): Invalid[] =>
      'reason' in result ? [{ record, reason: result.reason }] : [],
    ),
  };
};
