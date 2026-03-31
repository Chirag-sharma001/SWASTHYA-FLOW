import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { socketService } from '../services/socketService';
import { db } from '../services/db';
import { estimateWait } from '../utils/waitEstimator';

/**
 * PatientCheckIn — reached by scanning the session QR code.
 * URL: /patient/join/:sessionId
 *
 * Phase 1: Form — patient enters their name (sessionId is pre-filled from URL).
 * Phase 2: Live Token Card — shows token number, status, and estimated wait.
 */
export default function PatientCheckIn() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [patientName, setPatientName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // After successful check-in
  const [token, setToken] = useState(null);
  const [session, setSession] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Track online/offline
  useEffect(() => {
    const up = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  // Socket subscription once we have a token
  useEffect(() => {
    if (!token) return;

    socketService.connect(sessionId);

    const handleQueueUpdate = ({ queue }) => {
      const updated = queue.find(t => t.tokenId === token.tokenId);
      if (updated) setToken(updated);
    };

    const handleCallNext = ({ tokenId, queue }) => {
      if (tokenId === token.tokenId) {
        const updated = queue.find(t => t.tokenId === tokenId);
        if (updated) setToken(updated);
      }
    };

    socketService.on('QUEUE_UPDATED', handleQueueUpdate);
    socketService.on('CALL_NEXT_PATIENT', handleCallNext);

    return () => {
      socketService.off('QUEUE_UPDATED', handleQueueUpdate);
      socketService.off('CALL_NEXT_PATIENT', handleCallNext);
    };
  }, [token?.tokenId, sessionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await apiService.createToken(patientName.trim(), sessionId);
      setToken(result.token);

      // Cache token locally for offline reads
      await db.queue.put({ ...result.token, syncStatus: 'synced' });

      // Fetch session for consultationDurations (for wait estimator)
      try {
        const queueData = await apiService.getQueue(sessionId);
        const activeSession = await db.sessions.get(sessionId);
        setSession(activeSession || null);
      } catch (_) { /* non-critical */ }
    } catch (err) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Derived display values
  const isCalled = token?.status === 'called';
  const isCompleted = token?.status === 'completed';
  const consultDurations = session?.consultationDurations ?? [];

  // Estimate position in queue (rough: use tokenNumber as proxy when no full queue)
  const estimatedWaitSec = token
    ? estimateWait(token.tokenNumber, consultDurations, 5)
    : 0;
  const estimatedWaitMin = Math.round(estimatedWaitSec / 60);

  // ── Phase 2: Live Token Card ──────────────────────────────────────────────
  if (token) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">

          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
              <span className="material-symbols-outlined">local_hospital</span>
            </div>
            <div>
              <h1 className="font-black text-xl text-teal-800 dark:text-teal-200 tracking-tight">SwasthQueue</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">OPD Management</p>
            </div>
          </div>

          {/* Called banner */}
          {isCalled && (
            <div className="bg-primary text-white rounded-2xl px-6 py-4 flex items-center gap-3 animate-pulse">
              <span className="material-symbols-outlined text-3xl">campaign</span>
              <div>
                <p className="font-black text-lg leading-tight">Your turn!</p>
                <p className="text-sm opacity-90">Please proceed to the doctor's room now.</p>
              </div>
            </div>
          )}

          {/* Token card */}
          <div className={`bg-surface-container-lowest rounded-2xl shadow-sm border-l-4 p-6 ${
            isCalled ? 'border-primary' : isCompleted ? 'border-surface-container' : 'border-teal-400'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Token Number</p>
                <span className="font-black text-6xl text-primary font-headline leading-none">
                  T-{token.tokenNumber}
                </span>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                isCalled ? 'bg-primary text-white'
                : isCompleted ? 'bg-surface-container text-on-surface-variant'
                : 'bg-teal-50 text-teal-700 border border-teal-200'
              }`}>
                {token.status.toUpperCase()}
              </span>
            </div>

            <div className="border-t border-surface-container pt-4 space-y-3">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Patient</p>
                <p className="font-bold text-on-surface">{token.patientName}</p>
              </div>

              {!isCalled && !isCompleted && (
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Est. Wait</p>
                  <p className="font-black text-2xl text-on-surface">
                    {estimatedWaitMin > 0 ? `~${estimatedWaitMin} min` : '< 1 min'}
                  </p>
                </div>
              )}

              {isCompleted && (
                <p className="text-sm text-on-surface-variant font-medium">Consultation complete. Thank you!</p>
              )}
            </div>
          </div>

          {/* Offline indicator */}
          {!isOnline && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-bold">
              <span className="material-symbols-outlined text-sm">wifi_off</span>
              Offline — showing last known status
            </div>
          )}

          {/* Live indicator */}
          {isOnline && !isCalled && !isCompleted && (
            <p className="text-center text-xs text-on-surface-variant flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Live updates active — stay on this page
            </p>
          )}

          <button
            onClick={() => navigate('/')}
            className="w-full py-3 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Phase 1: Check-In Form ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mx-auto">
            <span className="material-symbols-outlined text-3xl">how_to_reg</span>
          </div>
          <h1 className="font-black text-2xl text-teal-800 dark:text-teal-200">Patient Check-In</h1>
          <p className="text-sm text-on-surface-variant">Enter your name to join the queue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 space-y-5">

          {/* Session ID (read-only, auto-filled from QR) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide">
              Session ID
            </label>
            <div className="w-full px-4 py-3 bg-surface-container rounded-xl text-sm text-on-surface-variant font-mono truncate border border-outline-variant/20">
              {sessionId}
            </div>
          </div>

          {/* Patient name */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide">
              Your Full Name
            </label>
            <input
              className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
              placeholder="e.g. Rahul Sharma"
              type="text"
              value={patientName}
              onChange={e => setPatientName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs text-error font-semibold">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !patientName.trim()}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:translate-y-[-1px] transition-all disabled:opacity-60"
          >
            {submitting ? 'Joining Queue…' : 'Join Queue'}
          </button>
        </form>

        <p className="text-center text-xs text-on-surface-variant">
          Powered by SwasthQueue OPD Management
        </p>
      </div>
    </div>
  );
}
