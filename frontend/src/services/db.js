import Dexie from 'dexie';

export const db = new Dexie('SwasthyaFlowDB');
db.version(1).stores({
  queue: 'tokenId, tokenNumber, patientName, status, sessionId, createdAt, calledAt, completedAt, syncStatus',
  pendingTokens: '++id, patientName, sessionId, createdAt, syncStatus',
  sessions: 'sessionId, doctorName, status, startedAt, closedAt'
});
