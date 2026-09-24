const PALETTE = [
  ['#5A0F24', '#C9A46C'],
  ['#191517', '#E8DCCB'],
  ['#7A1833', '#C9A46C'],
  ['#3B1822', '#A98456'],
  ['#33242A', '#C9A46C'],
  ['#5A0F24', '#E8DCCB'],
  ['#191517', '#C9A46C'],
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
