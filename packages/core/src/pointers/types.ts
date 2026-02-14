export const pointerTypes = [
  'classic-compass-needle',
  'slim-angular-needle',
  'thin-bar-needle',
  'diamond-spear-needle',
  'triangular-split-needle',
  'forked-center-needle',
  'simple-triangular-needle',
  'curved-classic-needle',
  'heavy-metallic-needle',
  'teardrop-bulb-needle',
  'curved-tail-needle',
  'narrow-spike-needle',
  'label-tip-marker-needle',
  'metallic-marker-needle',
  'ornate-ring-base-needle',
  'ring-base-bar-tail-needle'
] as const

export type PointerType = (typeof pointerTypes)[number]

export const pointerTypeDescriptions: Record<PointerType, string> = {
  'classic-compass-needle': 'Classic compass needle',
  'slim-angular-needle': 'Slim angular needle',
  'thin-bar-needle': 'Thin bar needle',
  'diamond-spear-needle': 'Diamond spear needle',
  'triangular-split-needle': 'Triangular split needle',
  'forked-center-needle': 'Forked center needle',
  'simple-triangular-needle': 'Simple triangular needle',
  'curved-classic-needle': 'Curved classic needle',
  'heavy-metallic-needle': 'Heavy metallic needle',
  'teardrop-bulb-needle': 'Teardrop bulb needle',
  'curved-tail-needle': 'Curved tail needle',
  'narrow-spike-needle': 'Narrow spike needle',
  'label-tip-marker-needle': 'Label-tip marker needle',
  'metallic-marker-needle': 'Metallic marker needle',
  'ornate-ring-base-needle': 'Ornate ring-base needle',
  'ring-base-bar-tail-needle': 'Ring-base bar-tail needle'
}
