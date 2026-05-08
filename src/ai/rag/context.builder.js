// src/ai/rag/context.builder.js

exports.buildContext = (documents) => {
  if (!documents || documents.length === 0) return "";

  let context = "Relevant CRM Data:\n\n";

  documents.forEach((doc, index) => {
    context += `(${index + 1}) ${doc.text}\n`;
  });

  return context;
};