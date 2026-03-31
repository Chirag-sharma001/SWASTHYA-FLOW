import React, { createContext, useReducer, useEffect, useState } from 'react';
import { socketService } from '../services/socketService';
import { db } from '../services/db';

const initialState = {
  queue: [],
  session: null,
};

function queueReducer(state, action) {
  switch (action.type) {
    case 'SET_QUEUE':
      return { ...state, queue: action.payload };
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'NEW_PATIENT_JOINED':
      return { ...state, queue: action.payload.queue };
    case 'CALL_NEXT_PATIENT':
      return { ...state, queue: action.payload.queue };
    case 'QUEUE_UPDATED':
      return { ...state, queue: action.payload.queue };
    case 'SESSION_STARTED':
      return { ...state, session: action.payload.session };
    case 'SESSION_ENDED':
      return { ...state, session: null, queue: [] };
    default:
      return state;
  }
}

export const QueueContext = createContext();

export function QueueProvider({ children }) {
  const [state, dispatch] = useReducer(queueReducer, initialState);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial load from IndexedDB
    const loadFromOffline = async () => {
      try {
        const cachedQueue = await db.queue.toArray();
        const activeSessions = await db.sessions.toArray();
        
        if (cachedQueue.length > 0) {
          dispatch({ type: 'SET_QUEUE', payload: cachedQueue });
        }
        
        const activeSession = activeSessions.find(s => s.status === 'active');
        if (activeSession) {
          dispatch({ type: 'SET_SESSION', payload: activeSession });
        }
      } catch (err) {
        console.error('Failed to load offline data', err);
      }
    };

    loadFromOffline();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Remove isOnline from dependency to run once on mount

  useEffect(() => {
    socketService.connect(state.session?.sessionId);

    socketService.on('NEW_PATIENT_JOINED', (data) => dispatch({ type: 'NEW_PATIENT_JOINED', payload: data }));
    socketService.on('CALL_NEXT_PATIENT', (data) => dispatch({ type: 'CALL_NEXT_PATIENT', payload: data }));
    socketService.on('QUEUE_UPDATED', (data) => dispatch({ type: 'QUEUE_UPDATED', payload: data }));
    socketService.on('SESSION_STARTED', (data) => dispatch({ type: 'SESSION_STARTED', payload: data }));
    socketService.on('SESSION_ENDED', (sessionId) => dispatch({ type: 'SESSION_ENDED', payload: sessionId }));

    return () => {
      socketService.disconnect();
    };
  }, [state.session?.sessionId]);

  return (
    <QueueContext.Provider value={{
      queue: state.queue,
      session: state.session,
      isOnline,
      dispatch
    }}>
      {children}
    </QueueContext.Provider>
  );
}
