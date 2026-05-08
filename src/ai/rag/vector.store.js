// src/ai/rag/vector.store.js

const store = [];

/*
Each item:
{
  id,
  text,
  embedding,
  metadata
}
*/

exports.add = ({ id, text, embedding, metadata = {} }) => {
  store.push({ id, text, embedding, metadata });
};

exports.getAll = () => store;

// cosine similarity
const cosineSimilarity = (a, b) => {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  return dot / (magA * magB);
};

exports.search = (queryEmbedding, topK = 5) => {
  const results = store.map((item) => {
    const score = cosineSimilarity(queryEmbedding, item.embedding);
    return { ...item, score };
  });

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
};