export const sitting = (over: Record<string, unknown> = {}) => ({
  code: 'ASW',
  num: 3,
  date: '2026-11-18',
  startDateTime: '2026-11-18T10:00:00',
  endDateTime: '2026-11-18T12:30:00',
  room: 'sala nr 118, bud. C',
  status: 'PLANNED',
  notes: 'Dodatkowe  uwagi',
  agenda: '<p>Porządek <b>obrad</b></p>',
  closed: false,
  remote: false,
  jointWith: [],
  ...over,
});

export const committee = (over: Record<string, unknown> = {}) => ({
  code: 'ENM',
  name: 'Komisja Edukacji',
  nameGenitive: 'Komisji Edukacji',
  ...over,
});

export const proceeding = (over: Record<string, unknown> = {}) => ({
  number: 7,
  title: '7.  Posiedzenie Sejmu RP',
  dates: ['2026-11-20', '2026-11-18'],
  current: false,
  ...over,
});
