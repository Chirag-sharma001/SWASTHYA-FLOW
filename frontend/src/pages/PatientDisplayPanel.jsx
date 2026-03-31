
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePatientStatus } from '../hooks/usePatientStatus';

export default function PatientDisplayPanel() {
  const navigate = useNavigate();
  const { tokenId } = useParams();
  const { token, estimatedWait, isOnline } = usePatientStatus(tokenId);

  // Live clock
  const [clock, setClock] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-IN', { hour12: false }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
  });

  const isCalled = token?.status === 'called';
  const estimatedWaitMin = Math.round(estimatedWait / 60);

  return (
    <>

<header className="bg-surface-container-lowest px-10 py-6 flex justify-between items-center shadow-sm z-50">
<div className="flex items-center gap-8">
<div className="flex items-center gap-4">
<div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center text-on-primary">
<span className="material-symbols-outlined text-4xl" data-icon="hospital">local_hospital</span>
</div>
<div>
<h1 className="font-headline font-extrabold text-4xl text-primary tracking-tight">City Public Hospital</h1>
<p className="font-label text-xl font-semibold text-on-surface-variant uppercase tracking-widest">General OPD</p>
</div>
</div>
</div>
<div className="flex items-center gap-12">
<div className={`flex items-center gap-3 px-6 py-3 rounded-full ${isOnline ? 'bg-error-container' : 'bg-amber-100'}`}>
<span className="inline-block w-3 h-3 rounded-full bg-error animate-ping opacity-75"></span>
<span className={`font-label font-bold text-xl uppercase tracking-wider ${isOnline ? 'text-on-error-container' : 'text-amber-700'}`}>
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
    🔔 Token T-{token.tokenNumber} — {token.patientName} — Please proceed to the doctor's room now!
  </div>
)}

<main className="flex-grow flex gap-8 p-10 bg-surface">

<section className="flex-[3] flex flex-col">
<div className="mb-4">
<span className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container px-8 py-3 rounded-t-2xl font-headline font-black text-3xl uppercase tracking-tighter">
<span className="material-symbols-outlined text-4xl" data-icon="campaign">campaign</span>
                    Now Serving
                </span>
</div>
<div className="bg-surface-container-lowest rounded-3xl rounded-tl-none p-12 flex flex-col justify-center flex-grow shadow-lg border-l-8 border-primary relative overflow-hidden">

<span className="material-symbols-outlined absolute -right-10 -bottom-10 text-[30rem] opacity-[0.03] select-none" data-icon="person">person</span>
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
<p className={`font-headline font-black text-5xl leading-none ${
  isCalled ? 'text-primary' : 'text-on-surface'
}`}>
  {token ? token.status.toUpperCase() : 'WAITING'}
</p>
</div>
</div>
<div className="mt-10 border-t border-surface-container-high pt-10">
<p className="font-label text-3xl font-semibold text-on-surface-variant mb-4 uppercase tracking-wide">Patient Name</p>
<h3 className="font-headline font-bold text-8xl text-on-surface">
  {token ? token.patientName : tokenId === 'demo' ? 'Display Board' : 'Loading…'}
</h3>
</div>
</div>
</div>
</section>

<section className="flex-1 flex flex-col">
<div className="mb-4">
<span className="inline-flex items-center gap-2 bg-secondary text-on-secondary px-6 py-3 rounded-t-2xl font-headline font-bold text-2xl uppercase tracking-tight">
<span className="material-symbols-outlined" data-icon="list">list</span>
                    Queue Info
                </span>
</div>
<div className="flex flex-col gap-4 flex-grow">

{token ? (
  <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col gap-2 border-l-4 border-secondary shadow-sm">
    <p className="text-sm text-on-surface-variant font-semibold uppercase tracking-wide">Your Token</p>
    <span className="font-headline font-black text-5xl text-secondary">T-{token.tokenNumber}</span>
    <p className="font-headline font-bold text-2xl text-on-surface">{token.patientName}</p>
    <span className={`mt-2 inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold self-start ${
      isCalled
        ? 'bg-primary text-white'
        : token.status === 'completed'
        ? 'bg-surface-container text-on-surface-variant'
        : 'bg-secondary-container text-on-secondary-container'
    }`}>
      {token.status.toUpperCase()}
    </span>
    {token.syncStatus === 'pending_sync' && (
      <p className="text-xs text-amber-600 font-semibold mt-1">⚠ Registered offline – syncing when connection returns</p>
    )}
  </div>
) : (
  <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col gap-1 border-l-4 border-secondary shadow-sm">
    <span className="font-headline font-black text-4xl text-secondary/40">–</span>
    <p className="font-headline font-bold text-2xl text-on-surface-variant">No token found</p>
    <button
      className="mt-4 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg self-start"
      onClick={() => navigate('/reception')}
    >
      Go to Reception
    </button>
  </div>
)}

<div className="mt-auto bg-tertiary rounded-2xl p-6 text-on-tertiary flex items-center gap-4">
<div className="bg-white/20 p-3 rounded-full">
<span className="material-symbols-outlined text-3xl" data-icon="emergency">emergency</span>
</div>
<div>
<p className="font-label text-sm font-bold uppercase opacity-80">Emergency Contact</p>
<p className="font-headline font-black text-2xl tracking-tighter">EXT: 999</p>
</div>
</div>
</div>
</section>
</main>

<aside className="bg-tertiary-container py-6 px-10 flex justify-center items-center gap-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
<span className="material-symbols-outlined text-on-tertiary-container text-5xl" data-icon="schedule">schedule</span>
<div className="flex items-baseline gap-4">
<span className="font-headline font-bold text-4xl text-on-tertiary-container uppercase tracking-tight">Estimated Wait Time:</span>
<span className="font-headline font-black text-6xl text-white">
  {isCalled ? 'NOW' : token ? `${estimatedWaitMin} MINS` : '–'}
</span>
</div>
</aside>

<footer className="bg-inverse-surface py-4 px-10">
<div className="overflow-hidden">
<div className="flex gap-20 items-center whitespace-nowrap animate-marquee">
<span className="flex items-center gap-4 text-inverse-on-surface font-label font-medium text-2xl uppercase tracking-widest">
<span className="material-symbols-outlined text-primary-fixed" data-icon="info">info</span>
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
