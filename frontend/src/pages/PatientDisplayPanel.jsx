import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePatientStatus } from '../hooks/usePatientStatus';
import { useVoiceAnnouncement } from '../hooks/useVoiceAnnouncement';
import { QueueContext } from '../context/QueueContext';
import { socketService } from '../services/socketService';

export default function PatientDisplayPanel() {
  const navigate = useNavigate();
  const { tokenId } = useParams();
  const { token, estimatedWait, isOnline } = usePatientStatus(tokenId);
  const { session } = useContext(QueueContext);

  // Voice accessibility toggle — persisted in localStorage
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try { return localStorage.getItem('voiceEnabled') !== 'false'; } catch { return true; }
  });

  const { announce, unlock } = useVoiceAnnouncement(voiceEnabled);

  const toggleVoice = () => {
    unlock(); // ensure audio is unlocked on this interaction
    setVoiceEnabled(v => {
      const next = !v;
      try { localStorage.setItem('voiceEnabled', String(next)); } catch {}
      return next;
    });
  };

  // Listen for CALL_NEXT_PATIENT and announce in Hindi
  useEffect(() => {
    const handleCallNext = ({ tokenNumber, queue }) => {
      console.log('[Voice] CALL_NEXT_PATIENT received:', { tokenNumber, queue });
      
      // Find the called token to get patient name
      const called = queue?.find(t => t.tokenNumber === tokenNumber);
      const name = called?.patientName || 'Patient';
      
      console.log('[Voice] Announcing:', { tokenNumber, name, voiceEnabled });
      announce(tokenNumber, name, 'Doctor Room');
    };

    socketService.on('CALL_NEXT_PATIENT', handleCallNext);
    return () => socketService.off('CALL_NEXT_PATIENT', handleCallNext);
  }, [announce, voiceEnabled]);

  // Live clock
  const [clock, setClock] = useState('');
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
  });

  const isCalled = token?.status === 'called';
  const isCompleted = token?.status === 'completed';
  const isPending = token?.status === 'pending';
  const estimatedWaitMin = Math.round(estimatedWait / 60);

  return (
    <>
      <header className="bg-surface-container-lowest px-10 py-6 flex justify-between items-center shadow-sm z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-4xl">local_hospital</span>
            </div>
            <div>
              <h1 className="font-headline font-extrabold text-4xl text-primary tracking-tight">SwasthQueue OPD</h1>
              <p className="font-label text-xl font-semibold text-on-surface-variant uppercase tracking-widest">
                {token?.sessionId || 'Live Status Board'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* Voice Accessibility Toggle */}
          <button
            onClick={toggleVoice}
            title={voiceEnabled ? 'Voice On — click to disable' : 'Voice Off — click to enable'}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 font-bold text-sm transition-all ${
              voiceEnabled
                ? 'bg-primary border-primary text-white shadow-md'
                : 'bg-surface-container border-outline-variant text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {voiceEnabled ? 'volume_up' : 'volume_off'}
            </span>
            <span className="hidden sm:inline">
              {voiceEnabled ? 'Voice On' : 'Voice Off'}
            </span>
          </button>

          <div className={`flex items-center gap-3 px-6 py-3 rounded-full ${isOnline ? 'bg-emerald-100' : 'bg-amber-100'}`}>
            <span className={`inline-block w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span className={`font-label font-bold text-xl uppercase tracking-wider ${isOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
              {isOnline ? 'Live System' : 'Offline'}
            </span>
          </div>
          <div className="text-right">
            <div className="font-headline font-black text-5xl tabular-nums text-on-surface">{clock}</div>
            <div className="font-label text-lg font-medium text-on-surface-variant">{today}</div>
          </div>
        </div>
      </header>

      {/* Called notification banner */}
      {isCalled && (
        <div className="bg-primary text-white px-10 py-5 text-center font-headline font-black text-3xl animate-pulse">
          🔔 Token T-{token.tokenNumber} — {token.patientName} — Please proceed to the doctor's room!
        </div>
      )}

      <main className="flex-grow flex gap-8 p-10 bg-surface">
        <section className="flex-[3] flex flex-col">
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-8 py-3 rounded-t-2xl font-headline font-black text-3xl uppercase tracking-tighter">
              <span className="material-symbols-outlined text-4xl">campaign</span>
              {isCalled ? 'Now Serving' : isPending ? 'Your Position' : 'Queue Status'}
            </span>
          </div>
          <div className="bg-surface-container-lowest rounded-3xl rounded-tl-none p-12 flex flex-col justify-center flex-grow shadow-lg border-l-8 border-primary relative overflow-hidden">
            <span className="material-symbols-outlined absolute -right-10 -bottom-10 text-[30rem] opacity-[0.03] select-none">person</span>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="font-label text-3xl font-semibold text-on-surface-variant mb-2 uppercase">Token Number</p>
                  <h2 className="font-headline font-black text-[12rem] leading-none text-primary tracking-tighter">
                    {token ? `T-${token.tokenNumber}` : '–'}
                  </h2>
                </div>
                <div className="bg-surface-container text-center p-8 rounded-3xl min-w-[280px]">
                  <p className="font-label text-3xl font-semibold text-on-surface-variant mb-2 uppercase tracking-wide">Status</p>
                  <p className={`font-headline font-black text-5xl leading-none ${isCalled ? 'text-primary' : 'text-on-surface'}`}>
                    {token ? token.status.toUpperCase() : 'WAITING'}
                  </p>
                </div>
              </div>
              <div className="mt-10 border-t border-surface-container-high pt-10">
                <p className="font-label text-3xl font-semibold text-on-surface-variant mb-4 uppercase tracking-wide">Patient Name</p>
                <h3 className="font-headline font-bold text-8xl text-on-surface">
                  {token ? token.patientName : 'No active consultation'}
                </h3>
              </div>
            </div>
          </div>
        </section>

        <section className="flex-1 flex flex-col">
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 bg-secondary text-on-secondary px-6 py-3 rounded-t-2xl font-headline font-bold text-2xl uppercase tracking-tight">
              <span className="material-symbols-outlined">list</span>
              Queue Status
            </span>
          </div>
          <div className="flex flex-col gap-4 flex-grow">
            {token ? (
              <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col gap-2 border-l-4 border-secondary shadow-sm">
                <p className="text-sm text-on-surface-variant font-semibold uppercase tracking-wide">Viewing Token</p>
                <span className="font-headline font-black text-5xl text-secondary">T-{token.tokenNumber}</span>
                <p className="font-headline font-bold text-2xl text-on-surface">{token.patientName}</p>
                <span className={`mt-2 inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold self-start ${isCalled ? 'bg-primary text-white' : 'bg-secondary-container text-on-secondary-container'}`}>
                  {token.status.toUpperCase()}
                </span>
              </div>
            ) : (
              <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col gap-1 border-l-4 border-secondary shadow-sm">
                <p className="font-headline font-bold text-2xl text-on-surface-variant">General Display</p>
                <p className="text-sm text-on-surface-variant">Showing current patient status.</p>
              </div>
            )}

            {/* Voice status card */}
            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${voiceEnabled ? 'bg-primary/5 border-primary/20' : 'bg-surface-container border-outline-variant/20'}`}>
              <span className={`material-symbols-outlined text-2xl ${voiceEnabled ? 'text-primary' : 'text-on-surface-variant'}`}>
                {voiceEnabled ? 'record_voice_over' : 'voice_over_off'}
              </span>
              <div>
                <p className="text-sm font-bold text-on-surface">
                  {voiceEnabled ? 'Hindi Voice Announcements Active' : 'Voice Announcements Off'}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {voiceEnabled ? 'Token numbers announced in Hindi' : 'Tap "Voice On" to enable'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <aside className="bg-tertiary-container py-6 px-10 flex justify-center items-center gap-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <span className="material-symbols-outlined text-on-tertiary-container text-5xl">schedule</span>
        <div className="flex items-baseline gap-4">
          <span className="font-headline font-bold text-4xl text-on-tertiary-container uppercase tracking-tight">Estimated Wait:</span>
          <span className="font-headline font-black text-6xl text-white">
            {isCalled ? 'NOW' : isPending && token ? `${estimatedWaitMin} MINS` : '–'}
          </span>
        </div>
      </aside>

      <footer className="bg-inverse-surface py-4 px-10">
        <div className="overflow-hidden">
          <div className="flex gap-20 items-center whitespace-nowrap animate-marquee">
            <span className="flex items-center gap-4 text-inverse-on-surface font-label font-medium text-2xl uppercase tracking-widest">
              <span className="material-symbols-outlined text-primary-fixed">info</span>
              Please have your ID ready
            </span>
            <span className="text-surface-variant opacity-30">|</span>
            <span className="flex items-center gap-4 text-inverse-on-surface font-label font-medium text-2xl uppercase tracking-widest">
              कृपया अपनी आईडी तैयार रखें
            </span>
            <span className="text-surface-variant opacity-30">|</span>
            <span className="flex items-center gap-4 text-inverse-on-surface font-label font-medium text-2xl uppercase tracking-widest">
              Maintain social distance
            </span>
            <span className="text-surface-variant opacity-30">|</span>
            <span className="flex items-center gap-4 text-inverse-on-surface font-label font-medium text-2xl uppercase tracking-widest">
              सामाजिक दूरी बनाए रखें
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
