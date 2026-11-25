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

/** Parses the raw list from `/committees`. For when you fetch the data yourself. */
export const parseCommittees = (records: unknown[]): Parsed<Committee> =>
  parseAll({ records, read });

/** Map of committee code to genitive name, skipping committees without one. */
export const genitiveNames = (committees: Committee[]) =>
  Object.fromEntries(
    committees
      .filter(({ nameGenitive }) => nameGenitive !== '')
      .map(({ code, nameGenitive }) => [code, nameGenitive]),
  );

/**
 * Genitive name of a committee for use in a sentence. A subcommittee without
 * a name of its own takes its parent's (`Podkomisji ENM02S Komisji ...`);
 * an unknown code gives `komisji <code>`.
 */
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
