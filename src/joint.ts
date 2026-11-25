import type { CommitteeSitting, Meeting } from '@sejm/types';

const keyOf = ({ code, num }: { code: string; num: number }) =>
  `${code}-${num}`;

const hostOf = ({
  sitting,
  present,
}: {
  sitting: CommitteeSitting;
  present: Set<string>;
}) =>
  [sitting, ...sitting.jointWith]
    .filter((member) => present.has(keyOf(member)))
    .map(keyOf)
    .toSorted((first, second) => first.localeCompare(second))[0];

/**
 * Collapses joint sittings that the API lists on both sides into one
 * `Meeting` each. A joint sitting listed on one side only is kept as is.
 */
export const mergeJointSittings = (sittings: CommitteeSitting[]): Meeting[] => {
  const present = new Set(sittings.map(keyOf));

  return sittings
    .filter((sitting) => keyOf(sitting) === hostOf({ sitting, present }))
    .map((sitting) => ({
      sitting,
      codes: [
        sitting.code,
        ...sitting.jointWith
          .map((member) => member.code)
          .filter((code) => code !== sitting.code),
      ],
    }));
};
