// src/ai/memory/session.manager.js

const { v4: uuidv4 } = require("uuid");

const sessionStore = new Map();

/*
Structure:
sessionId → {
  userId,
  createdAt,
  lastActiveAt
}
*/

// Create new session
exports.createSession = (userId) => {
  const sessionId = uuidv4();

  sessionStore.set(sessionId, {
    userId,
    createdAt: new Date(),
    lastActiveAt: new Date(),
  });

  return sessionId;
};

// Get session
exports.getSession = (sessionId) => {
  return sessionStore.get(sessionId);
};

// Update last active time
exports.touchSession = (sessionId) => {
  const session = sessionStore.get(sessionId);

  if (session) {
    session.lastActiveAt = new Date();
  }
};

// Delete session
exports.deleteSession = (sessionId) => {
  sessionStore.delete(sessionId);
};


// Optional: cleanup inactive sessions (e.g. 30 min)
exports.cleanupSessions = (timeoutMinutes = 30) => {
  const now = new Date();

  for (const [sessionId, session] of sessionStore.entries()) {
    const diff =
      (now - new Date(session.lastActiveAt)) / (1000 * 60);

    if (diff > timeoutMinutes) {
      sessionStore.delete(sessionId);
    }
  }
};