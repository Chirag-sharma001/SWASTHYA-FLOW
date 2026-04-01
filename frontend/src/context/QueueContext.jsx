import React, { createContext, useReducer, useEffect, useRef, useState } from 'react';
import { socketService } from '../services/socketService';
import { apiService } from '../services/apiService';
import { db } from '../services/db';

const initialState = { queue: [], session: null };

function queueReducer(state, action) {
  switch (action.type) {
    case 'SET_QUEUE':
      return { ...state, queue: action.payload };
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'NEW_PATIENT_JOINED':
      return { ...state, queue: action.payload.queue ?? state.queue };
    case 'CALL_NEXT_PATIENT':
      return { ...state, queue: action.payload.queue ?? state.queue };
    case 'QUEUE_UPDATED':
      return { ...state, queue: action.payload.queue ?? state.queue };
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
  const sessionIdRef = useRef(null);
  const socketSetupDone = useRef(false);

  // ── Online/offline tracking ───────────────────────────────────────────────
  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  // ── Load from Dexie on mount, then immediately fetch fresh from API ───────
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // 1. Show cached data immediately so UI isn't blank
        const [cachedQueue, activeSessions] = await Promise.all([
          db.queue.toArray(),
          db.sessions.toArray(),
        ]);
        const cachedSession = activeSessions.find(s => s.status === 'active');
        if (cachedSession) {
          dispatch({ type: 'SET_SESSION', payload: cachedSession });
          sessionIdRef.current = cachedSession.sessionId;
        }
        if (cachedQueue.length > 0) {
          dispatch({ type: 'SET_QUEUE', payload: cachedQueue });
        }

        if (!navigator.onLine) return;

        // 2. Always fetch the real active session from server
        //    This syncs the laptop even if the session was started from another device
        let serverSession = null;
        try {
          serverSession = await apiService.getActiveSession();
          const clean = {
            sessionId: serverSession.sessionId,
            doctorName: serverSession.doctorName,
            status: serverSession.status,
            consultationDurations: serverSession.consultationDurations ?? [],
            startedAt: serverSession.startedAt,
            closedAt: serverSession.closedAt ?? null,
          };
          dispatch({ type: 'SET_SESSION', payload: clean });
          sessionIdRef.current = clean.sessionId;
          await db.sessions.clear();
          await db.sessions.put(clean);
          // Join socket room for this session
          socketService.connect(clean.sessionId);
        } catch (e) {
          if (e.status === 404) {
            // No active session on server — clear any stale local session
            if (cachedSession) {
              console.warn('[QueueContext] No active session on server, clearing stale cache');
              dispatch({ type: 'SESSION_ENDED' });
              await db.sessions.clear();
              await db.queue.clear();
            }
            return;
          }
        }

        // 3. Fetch fresh queue for the active session
        if (serverSession?.sessionId) {
          try {
            const fresh = await apiService.getQueue(serverSession.sessionId);
            dispatch({ type: 'SET_QUEUE', payload: fresh.queue });
            await db.queue.clear();
            if (fresh.queue.length > 0) await db.queue.bulkPut(fresh.queue);
          } catch (e) {
            console.warn('[QueueContext] Queue fetch failed:', e.message);
          }
        }
      } catch (err) {
        console.error('[QueueContext] Bootstrap failed:', err);
      }
    };

    bootstrap();
  }, []); // runs once on mount

  // ── Socket setup — done ONCE, never torn down ─────────────────────────────
  useEffect(() => {
    if (socketSetupDone.current) return;
    socketSetupDone.current = true;

    socketService.connect();

    socketService.on('NEW_PATIENT_JOINED', (data) => {
      dispatch({ type: 'NEW_PATIENT_JOINED', payload: data });
      if (data.queue) {
        db.queue.clear().then(() => db.queue.bulkPut(data.queue)).catch(() => {});
      }
    });

    socketService.on('CALL_NEXT_PATIENT', (data) => {
      dispatch({ type: 'CALL_NEXT_PATIENT', payload: data });
      if (data.queue) {
        db.queue.clear().then(() => db.queue.bulkPut(data.queue)).catch(() => {});
      }
    });

    socketService.on('QUEUE_UPDATED', (data) => {
      dispatch({ type: 'QUEUE_UPDATED', payload: data });
      if (data.queue) {
        db.queue.clear().then(() => db.queue.bulkPut(data.queue)).catch(() => {});
      }
    });

    socketService.on('SESSION_STARTED', (data) => {
      const s = data.session || data;
      const clean = {
        sessionId: s.sessionId,
        doctorName: s.doctorName,
        status: s.status,
        consultationDurations: s.consultationDurations ?? [],
        startedAt: s.startedAt,
        closedAt: s.closedAt ?? null,
      };
      dispatch({ type: 'SESSION_STARTED', payload: { session: clean } });
      db.sessions.put(clean).catch(() => {});
      // Join the socket room for this session
      socketService.connect(clean.sessionId);
    });

    socketService.on('SESSION_ENDED', (data) => {
      dispatch({ type: 'SESSION_ENDED', payload: data });
      db.sessions.clear().catch(() => {});
      db.queue.clear().catch(() => {});
    });

    // No cleanup — socket stays alive for the app lifetime
  }, []);

  // ── Join session room when session becomes known ──────────────────────────
  useEffect(() => {
    if (state.session?.sessionId && state.session.sessionId !== sessionIdRef.current) {
      sessionIdRef.current = state.session.sessionId;
      socketService.connect(state.session.sessionId);
    }
  }, [state.session?.sessionId]);

  return (
    <QueueContext.Provider value={{
      queue: state.queue,
      session: state.session,
      isOnline,
      dispatch,
    }}>
      {children}
    </QueueContext.Provider>
  );
}
