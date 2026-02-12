export const pointerTypes = [
  'type1',
  'type2',
  'type3',
  'type4',
  'type5',
  'type6',
  'type7',
  'type8',
  'type9',
  'type10',
  'type11',
  'type12',
  'type13',
  'type14',
  'type15',
  'type16'
] as const

export type PointerType = (typeof pointerTypes)[number]

export const pointerTypeDescriptions: Record<PointerType, string> = {
  type1: 'Classic compass needle',
  type2: 'Slim angular needle',
  type3: 'Thin bar needle',
  type4: 'Diamond spear needle',
  type5: 'Triangular split needle',
  type6: 'Forked center needle',
  type7: 'Simple triangular needle',
  type8: 'Curved classic needle',
  type9: 'Heavy metallic needle',
  type10: 'Teardrop bulb needle',
  type11: 'Curved tail needle',
  type12: 'Narrow spike needle',
  type13: 'Label-tip marker needle',
  type14: 'Metallic marker needle',
  type15: 'Ornate ring-base needle',
  type16: 'Ring-base bar-tail needle'
}
