const PALETTE = [
  ['#2C2925', '#C6A15B'],
  ['#716863', '#E8DFD1'],
  ['#252525', '#C9A45C'],
  ['#3B2F2A', '#A8813F'],
  ['#2E3934', '#C9A45C'],
  ['#2C2925', '#E8DFD1'],
  ['#716863', '#C6A15B'],
];

/** Simple deterministic string hash, used so the same product always
 * gets the same placeholder gradient instead of a random one on every render. */
function hashString(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Returns a CSS gradient string for products without photography yet. */
export function placeholderSwatch(seed = '') {
  const [from, to] = PALETTE[hashString(seed) % PALETTE.length];
  return `linear-gradient(155deg, ${from}, ${to})`;
}

/** First real product image URL, or a deterministic placeholder gradient. */
export function productImage(product) {
  return product?.images?.[0]?.url || null;
}
