import { isRecord, parseAll, textOf } from '@sejm/read';
import type { Committee, Parsed, Read } from '@sejm/types';

const SUBCOMMITTEE = /^([A-Z]{3})\d{2}[NS]$/;

const read = (record: unknown): Read<Committee> => {
  if (!isRecord(record) || typeof record.code !== 'string') {
    return { reason: 'a committee without a code' };
  }

  return {
    item: {
      code: record.code,
      name: textOf(record.name),
      nameGenitive: textOf(record.nameGenitive),
    },
  };
};

export const parseCommittees = (records: unknown[]): Parsed<Committee> =>
  parseAll({ records, read });

export const genitiveNames = (committees: Committee[]) =>
  Object.fromEntries(
    committees
      .filter(({ nameGenitive }) => nameGenitive !== '')
      .map(({ code, nameGenitive }) => [code, nameGenitive]),
  );

export const committeeGenitive = ({
  code,
  names,
}: {
  code: string;
  names: Record<string, string>;
}) => {
  const own = names[code];

  if (own) {
    return own;
  }

  const parent = SUBCOMMITTEE.exec(code)?.[1];
  const parentName = parent ? names[parent] : undefined;

  return parentName ? `Podkomisji ${code} ${parentName}` : `komisji ${code}`;
};
