import { useContext, useEffect } from 'react';
import { QueueContext } from '../context/QueueContext';
import { apiService } from '../services/apiService';
import { db } from '../services/db';

export function useQueue() {
  const { queue, session, isOnline, dispatch } = useContext(QueueContext);

  useEffect(() => {
    if (isOnline && session) {
      const fetchQueue = async () => {
        try {
          const data = await apiService.getQueue(session.sessionId);
          dispatch({ type: 'SET_QUEUE', payload: data.queue });
          
          await db.queue.clear();
          await db.queue.bulkAdd(data.queue);
        } catch (err) {
          console.error('Failed to sync queue on reconnect:', err);
        }
      };
      fetchQueue();
    }
  }, [isOnline, session, dispatch]);

  const callNext = async () => {
    if (!session || !isOnline) return;
    try {
      const data = await apiService.callNext(session.sessionId);
      dispatch({ type: 'CALL_NEXT_PATIENT', payload: data });
    } catch (err) {
      console.error('Error calling next patient:', err);
      throw err;
    }
  };

  const completeConsultation = async (tokenId) => {
    if (!isOnline) return;
    try {
      const data = await apiService.completeConsultation(tokenId);
      dispatch({ type: 'QUEUE_UPDATED', payload: { queue: data.queue } });
    } catch (err) {
      console.error('Error completing consultation:', err);
      throw err;
    }
  };
  
  const startSession = async (doctorName) => {
    if (!isOnline) return;
    try {
      const data = await apiService.startSession(doctorName);
      dispatch({ type: 'SESSION_STARTED', payload: { session: data } });
      await db.sessions.put(data);
    } catch (err) {
      console.error('Error starting session', err);
      throw err;
    }
  };
  
  const endSession = async () => {
    if (!session || !isOnline) return;
    try {
      await apiService.endSession(session.sessionId);
      dispatch({ type: 'SESSION_ENDED' });
      await db.sessions.clear();
      await db.queue.clear();
    } catch (err) {
      console.error('Error ending session', err);
      throw err;
    }
  };

  return {
    queue,
    session,
    isOnline,
    callNext,
    completeConsultation,
    startSession,
    endSession
  };
}
