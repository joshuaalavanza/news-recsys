// server/recommend.js
export function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(t => t && !STOP.has(t));
}

const STOP_WORDS = [
  "the","a","an","and","or","of","to","in","on","for","with","by","from",
  "is","are","was","were","be","as","at","that","this","it","its","into",
  "about","over","after","before","than","then","but","so","not","no","up","down"
];
const STOP = new Set(STOP_WORDS);

// Bag-of-words vector (term frequency)
export function vectorize(tokens) {
  const v = new Map();
  for (const t of tokens) v.set(t, (v.get(t) || 0) + 1);
  return v;
}

export function addVectors(acc, v) {
  for (const [k, val] of v.entries()) acc.set(k, (acc.get(k) || 0) + val);
  return acc;
}

export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (const [, va] of a) na += va * va;
  for (const [, vb] of b) nb += vb * vb;
  // iterate over smaller
  const small = a.size <= b.size ? a : b;
  const big   = a.size <= b.size ? b : a;
  for (const [k, v] of small.entries()) {
    const u = big.get(k);
    if (u) dot += v * u;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// Build a simple user profile from liked articles
export function buildProfile(likedArticles) {
  const acc = new Map();
  for (const a of likedArticles) {
    const toks = tokenize(`${a.title || ""} ${a.description || ""} ${a.content || ""}`);
    addVectors(acc, vectorize(toks));
  }
  return acc;
}

// Score a candidate article against a user profile
export function scoreArticle(profile, art) {
  const toks = tokenize(`${art.title || ""} ${art.description || ""} ${art.content || ""}`);
  const v = vectorize(toks);
  return cosine(profile, v);
}