import { useContext, useEffect, useCallback } from 'react';
import { QueueContext } from '../context/QueueContext';
import { apiService } from '../services/apiService';
import { db } from '../services/db';

export function useQueue() {
  const { queue, session, isOnline, dispatch } = useContext(QueueContext);

  // Fetch fresh queue whenever we have a session and are online
  const syncQueue = useCallback(async (sessionId) => {
    try {
      const data = await apiService.getQueue(sessionId);
      dispatch({ type: 'SET_QUEUE', payload: data.queue });
      await db.queue.clear();
      if (data.queue.length > 0) await db.queue.bulkAdd(data.queue);
    } catch (err) {
      console.error('Failed to sync queue:', err);
    }
  }, [dispatch]);

  // Re-fetch whenever session becomes available OR we come back online
  useEffect(() => {
    if (isOnline && session?.sessionId) {
      syncQueue(session.sessionId);
    }
  }, [isOnline, session?.sessionId, syncQueue]);

  const callNext = async () => {
    if (!session || !isOnline) return;
    try {
      const data = await apiService.callNext(session.sessionId);
      dispatch({ type: 'CALL_NEXT_PATIENT', payload: data });
      if (data.queue) {
        await db.queue.clear();
        await db.queue.bulkAdd(data.queue);
      }
    } catch (err) {
      // If session not found in DB, clear stale local state
      if (err.status === 404 && err.message?.toLowerCase().includes('session')) {
        console.warn('[callNext] Session not found in DB — clearing stale local session');
        dispatch({ type: 'SESSION_ENDED' });
        await db.sessions.clear();
        await db.queue.clear();
        throw new Error('Session expired. Please start a new session.');
      }
      throw err;
    }
  };

  const completeConsultation = async (tokenId) => {
    if (!isOnline) return;
    const data = await apiService.completeConsultation(tokenId);
    dispatch({ type: 'QUEUE_UPDATED', payload: data });
    if (data.queue) {
      await db.queue.clear();
      await db.queue.bulkAdd(data.queue);
    }
  };

  const startSession = async (doctorName) => {
    if (!isOnline) return;
    const data = await apiService.startSession(doctorName);
    // Strip any Mongoose internal fields before storing
    const clean = {
      sessionId: data.sessionId,
      doctorName: data.doctorName,
      status: data.status,
      consultationDurations: data.consultationDurations ?? [],
      startedAt: data.startedAt,
      closedAt: data.closedAt ?? null,
    };
    dispatch({ type: 'SESSION_STARTED', payload: { session: clean } });
    await db.sessions.put(clean);
    await syncQueue(clean.sessionId);
  };

  const endSession = async () => {
    if (!session || !isOnline) return;
    // Use sessionId field explicitly — never use Mongoose _id
    const id = session.sessionId;
    if (!id) throw new Error('Session ID missing');
    await apiService.endSession(id);
    dispatch({ type: 'SESSION_ENDED' });
    await db.sessions.clear();
    await db.queue.clear();
  };

  return {
    queue,
    session,
    isOnline,
    callNext,
    completeConsultation,
    startSession,
    endSession,
  };
}
