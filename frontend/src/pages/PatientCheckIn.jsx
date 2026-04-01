import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { QueueContext } from '../context/QueueContext';
import { db } from '../services/db';
import { estimateWait } from '../utils/waitEstimator';
import { useVoiceAnnouncement } from '../hooks/useVoiceAnnouncement';
import { socketService } from '../services/socketService';

/**
 * PatientCheckIn — reached by scanning the session QR code.
 * URL: /patient/join/:sessionId
 *
 * Uses QueueContext for real-time socket updates (already connected globally).
 * Phase 1: Form. Phase 2: Live Token Card.
 */
export default function PatientCheckIn() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // Use global context — socket is already connected here
  const { queue, isOnline } = useContext(QueueContext);

  const [patientName, setPatientName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [myTokenId, setMyTokenId] = useState(null);
  const [consultDurations, setConsultDurations] = useState([]);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try { return localStorage.getItem('voiceEnabled') !== 'false'; } catch { return true; }
  });

  const { announce, unlock } = useVoiceAnnouncement(voiceEnabled);

  // Listen for CALL_NEXT_PATIENT — announce if it's this patient's token
  useEffect(() => {
    if (!myTokenId) return;
    const handleCallNext = ({ tokenId, tokenNumber, queue: q }) => {
      if (tokenId === myTokenId) {
        const called = q?.find(t => t.tokenId === tokenId);
        announce(tokenNumber, called?.patientName || '', 'Doctor Room');
      }
    };
    socketService.on('CALL_NEXT_PATIENT', handleCallNext);
    return () => socketService.off('CALL_NEXT_PATIENT', handleCallNext);
  }, [myTokenId, announce]);

  // Derive live token from global queue whenever it updates
  const token = myTokenId ? queue.find(t => t.tokenId === myTokenId) || null : null;

  // On submit: register patient, store tokenId, cache session durations
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) return;
    unlock(); // unlock audio on this tap — satisfies mobile user-activation requirement
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiService.createToken(patientName.trim(), sessionId);
      const newToken = result.token;
      setMyTokenId(newToken.tokenId);

      // Cache token locally
      await db.queue.put({ ...newToken, syncStatus: 'synced' });

      // Fetch session for wait estimator durations
      try {
        const cached = await db.sessions.get(sessionId);
        if (cached?.consultationDurations) {
          setConsultDurations(cached.consultationDurations);
        }
      } catch (_) { /* non-critical */ }
    } catch (err) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Keep consultDurations in sync when queue updates bring new session data
  useEffect(() => {
    if (!myTokenId) return;
    db.sessions.get(sessionId).then(s => {
      if (s?.consultationDurations) setConsultDurations(s.consultationDurations);
    }).catch(() => {});
  }, [queue, sessionId, myTokenId]);

  // Derived display values
  const isCalled = token?.status === 'called';
  const isCompleted = token?.status === 'completed';
  const pendingAhead = queue.filter(t => t.status === 'pending' && t.tokenNumber < (token?.tokenNumber ?? Infinity)).length;
  const estimatedWaitSec = token ? estimateWait(Math.max(1, pendingAhead + 1), consultDurations, 5) : 0;
  const estimatedWaitMin = Math.round(estimatedWaitSec / 60);

  // ── Phase 2: Live Token Card ──────────────────────────────────────────────
  if (myTokenId) {
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
          {token ? (
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
                    <p className="text-xs text-on-surface-variant mt-1">{pendingAhead} patient{pendingAhead !== 1 ? 's' : ''} ahead of you</p>
                  </div>
                )}

                {isCompleted && (
                  <p className="text-sm text-on-surface-variant font-medium">Consultation complete. Thank you!</p>
                )}
              </div>
            </div>
          ) : (
            // Token not yet in queue state — show loading
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-primary/40 animate-pulse block mb-2">hourglass_top</span>
              <p className="text-sm text-on-surface-variant font-medium">Waiting for queue update…</p>
            </div>
          )}

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

          {/* Voice toggle */}
          <button
            onClick={() => {
              unlock();
              setVoiceEnabled(v => {
                const next = !v;
                try { localStorage.setItem('voiceEnabled', String(next)); } catch {}
                return next;
              });
            }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
              voiceEnabled
                ? 'bg-primary/5 border-primary/30 text-primary'
                : 'bg-surface-container border-outline-variant/30 text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {voiceEnabled ? 'volume_up' : 'volume_off'}
            </span>
            {voiceEnabled ? 'Voice Announcements On' : 'Voice Announcements Off'}
          </button>

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

        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mx-auto">
            <span className="material-symbols-outlined text-3xl">how_to_reg</span>
          </div>
          <h1 className="font-black text-2xl text-teal-800 dark:text-teal-200">Patient Check-In</h1>
          <p className="text-sm text-on-surface-variant">Enter your name to join the queue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/20 space-y-5">

          <div className="space-y-1">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide">Session ID</label>
            <div className="w-full px-4 py-3 bg-surface-container rounded-xl text-sm text-on-surface-variant font-mono truncate border border-outline-variant/20">
              {sessionId}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide">Your Full Name</label>
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

          {error && <p className="text-xs text-error font-semibold">{error}</p>}

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
