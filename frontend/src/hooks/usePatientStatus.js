import { useContext, useEffect, useState } from 'react';
import { QueueContext } from '../context/QueueContext';
import { estimateWait } from '../utils/waitEstimator';
import { db } from '../services/db';

export function usePatientStatus(tokenId) {
  const { queue, session, isOnline } = useContext(QueueContext);
  const [token, setToken] = useState(null);
  const [estimatedWait, setEstimatedWait] = useState(0);

  useEffect(() => {
    if (!tokenId || tokenId === 'demo') {
      // If no tokenId or 'demo', show the currently called patient
      const called = queue.find(t => t.status === 'called');
      if (called) {
        setToken(called);
        setEstimatedWait(0);
      } else {
        // If nothing is called, show the first pending patient but with wait time
        const firstPending = queue.find(t => t.status === 'pending');
        if (firstPending) {
          setToken(firstPending);
          setEstimatedWait(firstPending.estimatedWait || 300);
        } else {
          setToken(null);
          setEstimatedWait(0);
        }
      }
      return;
    }
    // Attempt local state matching first
    let currentToken = queue.find(t => t.tokenId === tokenId);
    
    // If not online and not found, try dexie
    if (!currentToken && !isOnline) {
      db.queue.get(tokenId).then(dbToken => {
        if (dbToken) setToken(dbToken);
      });
    } else if (currentToken) {
      setToken(currentToken);
      setEstimatedWait(currentToken.estimatedWait || 0);
    }
  }, [queue, tokenId, isOnline, session]);

  return {
    token,
    estimatedWait,
    isOnline
  };
}
