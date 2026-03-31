import { useContext, useEffect, useState } from 'react';
import { QueueContext } from '../context/QueueContext';
import { estimateWait } from '../utils/waitEstimator';
import { db } from '../services/db';

export function usePatientStatus(tokenId) {
  const { queue, session, isOnline } = useContext(QueueContext);
  const [token, setToken] = useState(null);
  const [estimatedWait, setEstimatedWait] = useState(0);

  useEffect(() => {
    // Attempt local state matching first
    let currentToken = queue.find(t => t.tokenId === tokenId);
    
    // If not online and not found, try dexie
    if (!currentToken && !isOnline) {
      db.queue.get(tokenId).then(dbToken => {
        if (dbToken) setToken(dbToken);
      });
    } else if (currentToken) {
      setToken(currentToken);
      
      // Calculate Wait Estimator
      const pendingQueue = queue.filter(t => t.status === 'pending');
      const position = pendingQueue.findIndex(t => t.tokenId === tokenId);
      
      if (position >= 0) {
        if (session && session.consultationDurations) {
          setEstimatedWait(estimateWait(position + 1, session.consultationDurations));
        } else {
          setEstimatedWait((position + 1) * 300); // 5 mins fallback
        }
      } else {
        setEstimatedWait(0);
      }
    }
  }, [queue, tokenId, isOnline, session]);

  return {
    token,
    estimatedWait,
    isOnline
  };
}
