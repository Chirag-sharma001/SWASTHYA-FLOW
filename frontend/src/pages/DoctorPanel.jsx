
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../hooks/useQueue';
import { estimateWait } from '../utils/waitEstimator';

export default function DoctorPanel() {
  const navigate = useNavigate();
  const { queue, session, isOnline, callNext, completeConsultation, startSession, endSession } = useQueue();

  const [doctorName, setDoctorName] = useState('Dr. Ananya Sharma');
  const [sessionStarting, setSessionStarting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFullQueue, setShowFullQueue] = useState(false);

  const calledToken = queue.find(t => t.status === 'called');
  const pendingQueue = queue.filter(t => t.status === 'pending');
  const completedCount = queue.filter(t => t.status === 'completed').length;
  const consultDurations = session?.consultationDurations ?? [];
  const avgDuration = consultDurations.length > 0
    ? Math.round(consultDurations.slice(-5).reduce((a, b) => a + b, 0) / Math.min(consultDurations.length, 5) / 60)
    : 0;
  const nextEtaMin = pendingQueue.length > 0
    ? Math.round((pendingQueue[0].estimatedWait || 0) / 60)
    : 0;

  // Consultation timer
  useEffect(() => {
    let interval;
    if (calledToken?.calledAt) {
      interval = setInterval(() => {
        setTimer(Math.floor((Date.now() - calledToken.calledAt) / 1000));
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [calledToken]);

  const timerDisplay = `${String(Math.floor(timer / 60)).padStart(2, '0')}:${String(timer % 60).padStart(2, '0')}`;

  const handleStartSession = async () => {
    if (!isOnline) {
      alert('You are offline. Please reconnect to start a new session.');
      return;
    }
    setSessionStarting(true);
    try {
      console.log('Starting session with doctor:', doctorName);
      await startSession(doctorName);
      console.log('Session started successfully');
    } catch (err) {
      console.error('Failed to start session:', err);
      alert('Failed to start session: ' + (err.message || 'Unknown error'));
    } finally {
      setSessionStarting(false);
    }
  };

  const handleCallNext = async () => {
    if (!isOnline) {
      alert('You are offline. Reconnect to call next patient.');
      return;
    }
    if (!session) {
      alert('No active session. Please start a session first.');
      return;
    }
    setActionLoading(true);
    try {
      await callNext();
    } catch (err) {
      alert('Failed to call next patient: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!isOnline) {
      alert('You are offline. Reconnect to complete consultation.');
      return;
    }
    if (!calledToken) return;
    setActionLoading(true);
    try { await completeConsultation(calledToken.tokenId); } finally { setActionLoading(false); }
  };

  const handleEndSession = async () => {
    if (!isOnline) {
      alert('You are offline. Reconnect to end session.');
      return;
    }
    if (confirm('Are you sure you want to end this session?')) {
      try {
        await endSession();
      } catch (err) {
        alert('Failed to end session: ' + (err.message || 'Unknown error'));
      }
    }
  };

  return (
    <>

<nav className="bg-slate-50 dark:bg-slate-950 h-screen w-64 fixed left-0 top-0 hidden lg:flex flex-col bg-slate-100 dark:bg-slate-900 font-['Public_Sans'] text-sm font-medium border-r border-outline-variant/20">
<div className="flex flex-col h-full py-6 px-4 space-y-2">
<div className="flex items-center gap-3 px-2 mb-8">
<div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
<span className="material-symbols-outlined">health_and_safety</span>
</div>
<div>
<h2 className="text-xl font-black text-teal-800 dark:text-teal-200 leading-tight">SwasthQueue</h2>
<p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">OPD Management</p>
</div>
</div>

<a className="bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm rounded-lg mx-2 my-1 flex items-center gap-3 px-3 py-2.5 transition-all duration-200 ease-in-out" href="#" onClick={e => { e.preventDefault(); navigate('/'); }}>
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
<span>Dashboard</span>
</a>

<a className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 mx-2 my-1 flex items-center gap-3 px-3 py-2.5 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200 ease-in-out" href="#">
<span className="material-symbols-outlined">queue</span>
<span>Queue</span>
</a>

<a className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 mx-2 my-1 flex items-center gap-3 px-3 py-2.5 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200 ease-in-out rounded-lg" href="#" onClick={e => { e.preventDefault(); navigate('/doctor/history'); }}>
<span className="material-symbols-outlined">history_edu</span>
<span>History</span>
</a>

<a className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 mx-2 my-1 flex items-center gap-3 px-3 py-2.5 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200 ease-in-out" href="#">
<span className="material-symbols-outlined">settings</span>
<span>Settings</span>
</a>
<div className="mt-auto px-2">
{session ? (
  <button
    className="w-full py-3 bg-error text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md"
    onClick={handleEndSession}
  >
    <span className="material-symbols-outlined">stop_circle</span>
    End Session
  </button>
) : (
  <button
    className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md"
    onClick={handleStartSession}
    disabled={sessionStarting}
  >
    <span className="material-symbols-outlined">add_circle</span>
    {sessionStarting ? 'Starting…' : 'Start Session'}
  </button>
)}
</div>
</div>
</nav>

<main className="lg:ml-64 min-h-screen flex flex-col">

<header className="bg-white dark:bg-slate-900 docked full-width top-0 z-50 border-b border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none flex justify-between items-center w-full px-8 py-4 sticky top-0">
<div className="flex items-center gap-3">
<button className="lg:hidden p-1 rounded-md hover:bg-slate-100 transition-colors" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu">
  <span className="material-symbols-outlined text-on-surface-variant">menu</span>
</button>
<div className="flex flex-col">
<h1 className="font-headline font-extrabold text-2xl text-teal-700 dark:text-teal-400 tracking-tight leading-none">{session?.doctorName ?? doctorName}</h1>
<div className="flex items-center gap-3 mt-1">
<span className="text-on-surface-variant font-medium text-sm flex items-center gap-1">
<span className="material-symbols-outlined text-sm">stethoscope</span> General Medicine
                    </span>
<span className="w-1 h-1 bg-outline-variant rounded-full"></span>
<span className="text-on-surface-variant font-medium text-sm flex items-center gap-1">
<span className="material-symbols-outlined text-sm">door_front</span> Room 04
                    </span>
{!isOnline && <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-md border border-amber-300">OFFLINE</span>}
</div>
</div>
</div>
<div className="flex items-center gap-3">
{/* Mobile session button — visible only on small screens */}
<div className="lg:hidden">
  {session ? (
    <button
      className="flex items-center gap-1.5 px-3 py-2 bg-error text-white rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all"
      onClick={handleEndSession}
    >
      <span className="material-symbols-outlined text-sm">stop_circle</span>
      End
    </button>
  ) : (
    <button
      className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all disabled:opacity-60"
      onClick={handleStartSession}
      disabled={sessionStarting}
    >
      <span className="material-symbols-outlined text-sm">add_circle</span>
      {sessionStarting ? '…' : 'Start'}
    </button>
  )}
</div>
<div className="hidden md:flex flex-col items-end mr-4">
<span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">System Status</span>
<span className={`font-bold text-sm flex items-center gap-1 ${isOnline ? 'text-primary' : 'text-amber-600'}`}>
<span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-primary animate-pulse' : 'bg-amber-400'}`}></span>
{isOnline ? 'Online' : 'Offline'}
                    </span>
</div>
<button className="p-2.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors relative">
<span className="material-symbols-outlined">notifications</span>
<span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
</button>
</div>
</header>

<div className="p-8 space-y-8 max-w-[1400px] w-full mx-auto">

<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 flex items-center gap-4">
<div className="w-12 h-12 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary">
<span className="material-symbols-outlined">group</span>
</div>
<div>
<p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Patients Seen Today</p>
<p className="text-2xl font-black text-on-surface">{completedCount}</p>
</div>
</div>
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 flex items-center gap-4">
<div className="w-12 h-12 rounded-lg bg-tertiary-container/10 flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined">timer</span>
</div>
<div>
<p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Avg. Duration</p>
<p className="text-2xl font-black text-on-surface">{avgDuration}m</p>
</div>
</div>
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 flex items-center gap-4 md:col-span-2">
<div className="ml-4">
<p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Pending in Queue</p>
<p className="text-lg font-bold text-on-surface">{pendingQueue.length} Patients Waiting</p>
</div>
</div>
</div>

<div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

<div className="xl:col-span-8 space-y-8">

{calledToken ? (
<section className="bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(15,23,42,0.06)] border border-primary/5 overflow-hidden">
<div className="bg-primary text-on-primary px-8 py-3 flex justify-between items-center">
<span className="text-xs font-bold uppercase tracking-widest opacity-90">Current Patient Consultation</span>
<span className="flex items-center gap-1.5 text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
<span className="material-symbols-outlined text-sm animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>fiber_manual_record</span> LIVE
                            </span>
</div>
<div className="p-10 flex flex-col md:flex-row gap-10 items-center md:items-start">

<div className="flex-1 space-y-6 text-center md:text-left">
<div>
<span className="text-primary font-black text-6xl font-headline tracking-tighter">T-{calledToken.tokenNumber}</span>
<h3 className="text-3xl font-bold text-on-surface mt-2">{calledToken.patientName}</h3>
<p className="text-on-surface-variant font-medium mt-1">Session: {calledToken.sessionId}</p>
</div>
</div>

<div className="w-full md:w-auto flex flex-col items-center justify-center bg-surface-container-low p-8 rounded-3xl min-w-[240px]">
<span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Duration</span>
<span className="text-5xl font-black font-headline text-on-surface tabular-nums">{timerDisplay}</span>
<div className="flex gap-4 mt-6">
<button className="w-12 h-12 rounded-full bg-white text-on-surface shadow-sm flex items-center justify-center hover:bg-slate-50 active:scale-90 transition-all">
<span className="material-symbols-outlined">pause</span>
</button>
<button className="w-12 h-12 rounded-full bg-white text-error shadow-sm flex items-center justify-center hover:bg-error-container/20 active:scale-90 transition-all">
<span className="material-symbols-outlined">refresh</span>
</button>
</div>
</div>
</div>

<div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border-t border-slate-100">
<button className="py-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors group">
<span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-3xl">skip_next</span>
<span className="text-sm font-bold text-on-surface">Skip / No Show</span>
</button>
<button className="py-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors group border-x border-slate-100">
<span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-3xl">record_voice_over</span>
<span className="text-sm font-bold text-on-surface">Recall Patient</span>
</button>
<button
  className="py-6 flex flex-col items-center justify-center gap-2 bg-primary hover:bg-primary-container transition-colors group disabled:opacity-60"
  onClick={handleComplete}
  disabled={actionLoading}
>
<span className="material-symbols-outlined text-white text-3xl">check_circle</span>
<span className="text-sm font-bold text-white">{actionLoading ? 'Completing…' : 'End Consultation'}</span>
</button>
</div>
</section>
) : (
<div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 p-10 text-center text-on-surface-variant">
  <span className="material-symbols-outlined text-5xl opacity-30 mb-4 block">person_off</span>
  <p className="font-semibold">No patient currently in consultation.</p>
</div>
)}

<button
  className="w-full py-8 bg-surface-container-highest/30 border-2 border-dashed border-outline-variant/50 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
  onClick={handleCallNext}
  disabled={actionLoading || pendingQueue.length === 0}
>
<div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform group-disabled:scale-100">
<span className="material-symbols-outlined text-4xl">person_add</span>
</div>
<span className="text-xl font-bold text-on-surface">
  {actionLoading ? 'Calling…' : pendingQueue.length === 0 ? 'No Patients Waiting' : 'Call Next Patient'}
</span>
<p className="text-sm text-on-surface-variant">
  {pendingQueue.length > 0
    ? <>Estimated wait for next: <span className="font-bold">{nextEtaMin}m</span></>
    : !session ? 'Start a session to begin'
    : 'Queue is empty'}
</p>
</button>
</div>

<div className="xl:col-span-4 space-y-8">

<section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
<div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
<h4 className="font-bold text-on-surface">Up Next</h4>
<span className="bg-surface-container-high px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight text-on-surface-variant">{pendingQueue.length} Patients</span>
</div>
<div className="divide-y divide-slate-50">
{pendingQueue.length === 0 && (
  <div className="p-6 text-center text-sm text-on-surface-variant">Queue is empty</div>
)}
{pendingQueue.slice(0, 5).map(token => (
  <div key={token.tokenId} className="p-5 flex items-center justify-between group hover:bg-slate-50 transition-colors">
  <div className="flex items-center gap-4">
  <span className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-xs font-bold text-on-surface">T-{token.tokenNumber}</span>
  <div>
  <p className="font-bold text-sm text-on-surface">{token.patientName}</p>
  <p className="text-xs text-on-surface-variant">{token.syncStatus === 'pending_sync' ? '⚠ Offline token' : 'Pending'}</p>
  </div>
  </div>
  <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors cursor-pointer">drag_indicator</span>
  </div>
))}
</div>
<button className="w-full py-4 text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary/5 transition-colors" onClick={() => setShowFullQueue(true)}>View Full Queue</button>
</section>

<section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
<div className="px-6 py-4 border-b border-slate-50">
<h4 className="font-bold text-on-surface">Recent Consultations</h4>
</div>
<div className="p-2">
<div className="flex flex-col gap-2">
{queue.filter(t => t.status === 'completed').slice(-3).reverse().map(token => (
  <div key={token.tokenId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
  <div className="w-2 h-8 bg-primary-fixed rounded-full"></div>
  <div className="flex-1">
  <p className="text-xs font-bold text-on-surface">{token.patientName} (T-{token.tokenNumber})</p>
  <p className="text-[10px] text-on-surface-variant">Completed</p>
  </div>
  <span className="material-symbols-outlined text-slate-400 text-sm">open_in_new</span>
  </div>
))}
{queue.filter(t => t.status === 'completed').length === 0 && (
  <div className="p-4 text-center text-xs text-on-surface-variant">No completed consultations yet</div>
)}
</div>
</div>
</section>
</div>
</div>
</div>

<footer className="w-full border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto">
<div className="flex flex-col md:flex-row justify-between items-center px-8 py-6 w-full">
<p className="font-['Public_Sans'] text-xs text-slate-500 dark:text-slate-400">© 2026 SwasthQueue Hospital Systems. Demo v1.0.4</p>
<div className="flex gap-6 mt-4 md:mt-0">
<a className="text-slate-400 hover:text-teal-600 transition-colors text-xs font-['Public_Sans']" href="#">Privacy Policy</a>
<a className="text-slate-400 hover:text-teal-600 transition-colors text-xs font-['Public_Sans']" href="#">Support</a>
<a className="text-slate-400 hover:text-teal-600 transition-colors text-xs font-['Public_Sans']" href="#">System Status</a>
</div>
</div>
</footer>
</main>

{/* Mobile nav overlay */}
{menuOpen && (
  <div className="fixed inset-0 z-[70] lg:hidden">
    <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
    <nav className="absolute left-0 top-0 h-full w-64 bg-slate-50 dark:bg-slate-950 flex flex-col py-6 px-4 space-y-2">
      <div className="px-4 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined">health_and_safety</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-teal-800 dark:text-teal-200 leading-tight">SwasthQueue</h2>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">OPD Management</p>
          </div>
        </div>
        <button onClick={() => setMenuOpen(false)} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800">
          <span className="material-symbols-outlined text-on-surface-variant">close</span>
        </button>
      </div>
      <div className="flex-grow space-y-1">
        <a className="flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all text-sm font-medium" href="#" onClick={e => { e.preventDefault(); navigate('/'); setMenuOpen(false); }}>
          <span className="material-symbols-outlined">dashboard</span>Dashboard
        </a>
        <a className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-slate-900 text-teal-700 shadow-sm rounded-lg text-sm font-semibold" href="#">
          <span className="material-symbols-outlined">queue</span>Queue
        </a>
        <a className="flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all text-sm font-medium" href="#" onClick={e => { e.preventDefault(); navigate('/doctor/history'); setMenuOpen(false); }}>
          <span className="material-symbols-outlined">history_edu</span>History
        </a>
      </div>
      <div className="mt-auto px-2">
        {session ? (
          <button className="w-full py-3 bg-error text-white rounded-xl font-bold flex items-center justify-center gap-2" onClick={() => { handleEndSession(); setMenuOpen(false); }}>
            <span className="material-symbols-outlined">stop_circle</span>End Session
          </button>
        ) : (
          <button className="w-full py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2" onClick={() => { handleStartSession(); setMenuOpen(false); }} disabled={sessionStarting}>
            <span className="material-symbols-outlined">add_circle</span>{sessionStarting ? 'Starting…' : 'Start Session'}
          </button>
        )}
      </div>
    </nav>
  </div>
)}

{/* Full Queue Modal */}
{showFullQueue && (
  <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50" onClick={() => setShowFullQueue(false)} />
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-on-surface text-lg">Full Queue</h3>
          <span className="bg-surface-container px-2 py-0.5 rounded text-xs font-bold text-on-surface-variant">{pendingQueue.length} Pending</span>
        </div>
        <button onClick={() => setShowFullQueue(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">close</span>
        </button>
      </div>
      <div className="overflow-y-auto flex-1 divide-y divide-slate-50 dark:divide-slate-800">
        {queue.length === 0 && (
          <div className="p-8 text-center text-sm text-on-surface-variant">Queue is empty</div>
        )}
        {queue.map((token) => {
          const isCalled = token.status === 'called';
          const isCompleted = token.status === 'completed';
          const etaMin = Math.round((token.estimatedWait || 0) / 60);
          return (
            <div key={token.tokenId} className={`flex items-center gap-4 px-6 py-4 ${isCalled ? 'bg-primary/5 border-l-4 border-primary' : isCompleted ? 'opacity-40' : 'hover:bg-slate-50'}`}>
              <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black ${isCalled ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface'}`}>
                T-{token.tokenNumber}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-on-surface truncate">{token.patientName}</p>
                <p className="text-[10px] text-on-surface-variant">{token.status.toUpperCase()}{token.abhaAddress ? ` · ${token.abhaAddress}` : ''}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${isCalled ? 'bg-primary text-white' : isCompleted ? 'bg-surface-container text-on-surface-variant' : 'bg-teal-50 text-teal-700'}`}>
                {isCalled ? 'At Door' : isCompleted ? 'Done' : etaMin > 0 ? `~${etaMin}m` : 'Pending'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
)}

    </>
  );
}
