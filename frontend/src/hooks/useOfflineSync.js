import { useContext, useEffect, useState } from 'react';
import { QueueContext } from '../context/QueueContext';
import { apiService } from '../services/apiService';
import { db } from '../services/db';

export function useOfflineSync() {
  const { isOnline, session, queue, dispatch } = useContext(QueueContext);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isOnline) {
      replayPendingTokens();
    }
  }, [isOnline]);

  const replayPendingTokens = async () => {
    if (syncing) return;
    setSyncing(true);
    
    try {
      const pending = await db.pendingTokens.toArray();
      // Sort by createdAt order
      pending.sort((a, b) => a.createdAt - b.createdAt);

      for (const token of pending) {
        try {
          await apiService.createToken(token.patientName, token.sessionId);
          await db.pendingTokens.delete(token.id);
        } catch (error) {
          console.error('Failed to sync token:', token, error);
        }
      }
      
      // Refresh queue if session exists
      if (session) {
        const queueData = await apiService.getQueue(session.sessionId);
        dispatch({ type: 'SET_QUEUE', payload: queueData });
        
        // Cache to dexie
        await db.queue.clear();
        await db.queue.bulkAdd(queueData);
      }
    } finally {
      setSyncing(false);
    }
  };

  const createTokenWithSync = async (patientName, sessionId) => {
    if (isOnline) {
      try {
        const result = await apiService.createToken(patientName, sessionId);
        dispatch({ type: 'NEW_PATIENT_JOINED', payload: result });
        
        // Cache to dexie
        await db.queue.put(result.token);
        return result.token;
      } catch (error) {
        throw error;
      }
    } else {
      // Offline fallback
      const offlineToken = {
        patientName,
        sessionId,
        createdAt: Date.now(),
        syncStatus: 'pending_sync'
      };
      await db.pendingTokens.add(offlineToken);
      
      // Optimistically update queue (create pseudo-token)
      const pseudoToken = {
        ...offlineToken,
        tokenId: `offline-${Date.now()}`,
        tokenNumber: queue.length + 1,
        status: 'pending'
      };
      
      const newQueue = [...queue, pseudoToken];
      dispatch({ type: 'SET_QUEUE', payload: newQueue });
      await db.queue.put(pseudoToken);
      
      return pseudoToken;
    }
  };

  return {
    createTokenWithSync,
    isOnline,
    queue,
    session,
    syncing
  };
}
