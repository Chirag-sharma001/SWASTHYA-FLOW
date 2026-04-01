import { useContext, useEffect, useRef, useState } from 'react';
import { QueueContext } from '../context/QueueContext';
import { apiService } from '../services/apiService';
import { db } from '../services/db';

/**
 * useOfflineSync
 *
 * Wraps token creation with offline-first logic:
 *   - Online  → hit API directly, cache result in Dexie
 *   - Offline → write to Dexie pendingTokens with syncStatus: 'pending_sync'
 *
 * On reconnect, all pending tokens are sent in a single batch via
 * POST /api/tokens/bulk-sync, then the Dexie cache is cleared.
 *
 * A `syncing` flag is exposed for the SyncStatusBadge.
 */
export function useOfflineSync() {
  const { isOnline, session, queue, dispatch } = useContext(QueueContext);
  const [syncing, setSyncing] = useState(false);
  // Guard against concurrent sync runs
  const syncingRef = useRef(false);

  useEffect(() => {
    if (isOnline) {
      replayPendingTokens();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  const replayPendingTokens = async () => {
    if (syncingRef.current) return;
    const pending = await db.pendingTokens.toArray();
    if (pending.length === 0) return;

    syncingRef.current = true;
    setSyncing(true);

    try {
      // Sort by creation order — atomic counter on backend assigns correct tokenNumbers
      pending.sort((a, b) => a.createdAt - b.createdAt);

      await apiService.bulkSync(pending);

      // Clear all pending records in one transaction
      await db.pendingTokens.bulkDelete(pending.map(t => t.id));

      // Refresh queue from server
      if (session) {
        const queueData = await apiService.getQueue(session.sessionId);
        dispatch({ type: 'SET_QUEUE', payload: queueData.queue });
        await db.queue.clear();
        await db.queue.bulkPut(queueData.queue);
      }
    } catch (err) {
      console.error('[useOfflineSync] bulk-sync failed:', err);
      // Leave pending records in Dexie — will retry on next reconnect
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  };

  const createTokenWithSync = async (patientName, sessionId, abhaAddress, phoneNumber, patientProfile, priority, department) => {
    if (isOnline) {
      const result = await apiService.createToken(patientName, sessionId, abhaAddress, phoneNumber, patientProfile, priority, department);
      // result shape: { token, queue }
      if (result.queue) {
        dispatch({ type: 'SET_QUEUE', payload: result.queue });
        await db.queue.clear();
        await db.queue.bulkPut(result.queue);
      }
      return result.token || result;
    }

    // ── Offline path ──────────────────────────────────────────────────────
    const offlineRecord = {
      patientName,
      sessionId,
      abhaAddress: abhaAddress || null,
      phoneNumber: phoneNumber || null,
      patientProfile: patientProfile || null,
      priority: priority || 'normal',
      department: department || 'General OPD',
      createdAt: Date.now(),
      syncStatus: 'pending_sync',
    };
    const id = await db.pendingTokens.add(offlineRecord);

    // Optimistic pseudo-token so the UI updates immediately
    const pseudoToken = {
      ...offlineRecord,
      id,
      tokenId: `offline-${id}-${Date.now()}`,
      tokenNumber: queue.length + 1,
      status: 'pending',
    };

    dispatch({ type: 'SET_QUEUE', payload: [...queue, pseudoToken] });
    await db.queue.put(pseudoToken);

    return pseudoToken;
  };

  return {
    createTokenWithSync,
    isOnline,
    queue,
    session,
    syncing,
  };
}
