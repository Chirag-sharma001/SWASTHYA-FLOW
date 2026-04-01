
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { estimateWait } from '../utils/waitEstimator';
import QRSessionCode from '../components/QRSessionCode';
import SyncStatusBadge from '../components/SyncStatusBadge';
import AbhaVerification from '../components/AbhaVerification';

export default function ReceptionPanel() {
  const navigate = useNavigate();
  const { createTokenWithSync, isOnline, queue, session, syncing } = useOfflineSync();

  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Select');
  const [patientPhone, setPatientPhone] = useState('');
  const [abhaAddress, setAbhaAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastToken, setLastToken] = useState(null);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAbha, setShowAbha] = useState(false);

  // Called when ABHA verification succeeds — auto-fills the form
  const handleAbhaVerified = (profile) => {
    setPatientName(profile.name || '');
    setPatientAge(profile.age ? String(profile.age) : '');
    setPatientGender(profile.gender || 'Select');
    setAbhaAddress(profile.abhaAddress || '');
    setShowAbha(false);
  };

  const waitingQueue = queue.filter(t => t.status === 'pending');
  const emergencyCount = queue.filter(t => t.status === 'pending' && t.priority === 'emergency').length;
  const consultDurations = session?.consultationDurations ?? [];
  const avgWaitSec = waitingQueue.length > 0
    ? (waitingQueue[0].estimatedWait || 0) / 60
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) return;
    if (!session) {
      setError('No active session found. Please wait for a doctor to start a session.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = await createTokenWithSync(patientName.trim(), session.sessionId, abhaAddress || undefined, patientPhone.trim() || undefined);
      setLastToken(token);
      setPatientName('');
      setPatientAge('');
      setPatientGender('Select');
      setPatientPhone('');
      setAbhaAddress('');
    } catch (err) {
      setError(err.message || 'Failed to issue token');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>

<header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none docked full-width top-0 z-50 flex justify-between items-center w-full px-6 py-3 max-w-full fixed lg:pl-72">
<div className="flex items-center gap-4">
<button
  className="lg:hidden p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
  onClick={() => setMenuOpen(prev => !prev)}
  aria-label="Toggle menu"
>
  <span className="material-symbols-outlined text-on-surface-variant">menu</span>
</button>
<h1 className="font-['Manrope'] font-semibold text-lg text-teal-700 dark:text-teal-400">Reception Dashboard</h1>
{<SyncStatusBadge isOnline={isOnline} syncing={syncing} />}
</div>
<div className="flex items-center space-x-4">
<div className="relative hidden md:block">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
<input className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-sm focus:ring-2 focus:ring-primary w-64" placeholder="Search Patient..." type="text"/>
</div>
<button className="p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
<span className="material-symbols-outlined text-on-surface-variant" data-icon="notifications">notifications</span>
</button>
<div className="flex items-center gap-2 pl-4 border-l border-outline-variant/30">
<div className="text-right hidden sm:block">
<p className="text-sm font-semibold leading-none">Sarah Jenkins</p>
<p className="text-xs text-on-surface-variant">Chief Receptionist</p>
</div>
<span className="material-symbols-outlined text-3xl text-primary" data-icon="account_circle">account_circle</span>
</div>
</div>
</header>

{/* Mobile nav overlay */}
{menuOpen && (
  <div className="fixed inset-0 z-[70] lg:hidden">
    <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
    <nav className="absolute left-0 top-0 h-full w-64 bg-slate-50 dark:bg-slate-950 flex flex-col py-6 px-4 space-y-2">
      <div className="px-4 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
            <span className="material-symbols-outlined" data-icon="medical_services">medical_services</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-teal-800 dark:text-teal-200 tracking-tight">SwasthQueue</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">OPD Management</p>
          </div>
        </div>
        <button onClick={() => setMenuOpen(false)} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800">
          <span className="material-symbols-outlined text-on-surface-variant">close</span>
        </button>
      </div>
      <div className="flex-grow space-y-1">
        <a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200 ease-in-out rounded-lg font-['Public_Sans'] text-sm font-medium mx-2 my-1" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); setMenuOpen(false); }}>
          <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
          Dashboard
        </a>
        <a className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm rounded-lg mx-2 my-1 font-['Public_Sans'] text-sm font-semibold" href="#">
          <span className="material-symbols-outlined" data-icon="queue">queue</span>
          Queue
        </a>
        <a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200 ease-in-out rounded-lg font-['Public_Sans'] text-sm font-medium mx-2 my-1" href="#" onClick={(e) => { e.preventDefault(); navigate('/daily-summary'); setMenuOpen(false); }}>
          <span className="material-symbols-outlined" data-icon="history">history</span>
          History
        </a>
        <a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200 ease-in-out rounded-lg font-['Public_Sans'] text-sm font-medium mx-2 my-1" href="#">
          <span className="material-symbols-outlined" data-icon="settings">settings</span>
          Settings
        </a>
      </div>
      <div className="mt-auto px-2 space-y-3">
        <QRSessionCode sessionId={session?.sessionId} size={140} />
        <button className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[0.98] transition-transform" onClick={() => { document.getElementById('patient-name-input')?.focus(); setMenuOpen(false); }}>
          <span className="material-symbols-outlined text-sm" data-icon="add">add</span>
          New Token
        </button>
      </div>
    </nav>
  </div>
)}

<nav className="bg-slate-50 dark:bg-slate-950 h-screen w-64 fixed left-0 top-0 hidden lg:flex flex-col py-6 px-4 space-y-2 z-[60]">
<div className="px-4 mb-8">
<div className="flex items-center gap-3">
<div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
<span className="material-symbols-outlined" data-icon="medical_services">medical_services</span>
</div>
<div>
<h2 className="text-xl font-black text-teal-800 dark:text-teal-200 tracking-tight">SwasthQueue</h2>
<p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">OPD Management</p>
</div>
</div>
</div>
<div className="flex-grow space-y-1">
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200 ease-in-out rounded-lg font-['Public_Sans'] text-sm font-medium mx-2 my-1" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
                Dashboard
            </a>
<a className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm rounded-lg mx-2 my-1 font-['Public_Sans'] text-sm font-semibold" href="#">
<span className="material-symbols-outlined" data-icon="queue">queue</span>
                Queue
            </a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200 ease-in-out rounded-lg font-['Public_Sans'] text-sm font-medium mx-2 my-1" href="#" onClick={(e) => { e.preventDefault(); navigate('/daily-summary'); }}>
<span className="material-symbols-outlined" data-icon="history">history</span>
                History
            </a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200 ease-in-out rounded-lg font-['Public_Sans'] text-sm font-medium mx-2 my-1" href="#">
<span className="material-symbols-outlined" data-icon="settings">settings</span>
                Settings
            </a>
</div>
<div className="mt-auto px-2">
<div className="mb-3">
  <QRSessionCode sessionId={session?.sessionId} size={160} />
</div>
<button className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[0.98] transition-transform" onClick={() => document.getElementById('patient-name-input')?.focus()}>
<span className="material-symbols-outlined text-sm" data-icon="add">add</span>
                New Token
            </button>
</div>
</nav>

<main className="lg:ml-64 pt-20 px-6 pb-12 min-h-screen">

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-transparent hover:border-primary/10 transition-all">
<p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Total Tokens</p>
<div className="flex items-end justify-between">
<h3 className="text-3xl font-bold font-headline text-on-surface">{queue.length}</h3>
<span className="text-teal-600 text-xs font-bold bg-teal-50 px-2 py-1 rounded">Today</span>
</div>
</div>
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-transparent">
<p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Currently Waiting</p>
<div className="flex items-end justify-between">
<h3 className="text-3xl font-bold font-headline text-on-surface">{waitingQueue.length}</h3>
<div className="flex -space-x-2">
<div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200"></div>
<div className="w-6 h-6 rounded-full border-2 border-white bg-slate-300"></div>
<div className="w-6 h-6 rounded-full border-2 border-white bg-slate-400"></div>
</div>
</div>
</div>
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-transparent">
<p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Avg. Wait Time</p>
<div className="flex items-end justify-between">
<h3 className="text-3xl font-bold font-headline text-on-surface">{Math.round(avgWaitSec)}<span className="text-lg font-medium text-on-surface-variant ml-1">m</span></h3>
<span className="material-symbols-outlined text-primary/40" data-icon="schedule">schedule</span>
</div>
</div>
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-transparent relative overflow-hidden">
<div className="absolute top-0 right-0 w-1 bg-error h-full"></div>
<p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Emergency</p>
<div className="flex items-end justify-between">
<h3 className="text-3xl font-bold font-headline text-error">{emergencyCount}</h3>
<span className="material-symbols-outlined text-error pulse-emergency rounded-full p-1" data-icon="emergency">emergency</span>
</div>
</div>
</div>
<div className="flex flex-col xl:flex-row gap-8">

<aside className="xl:w-1/3 w-full">
<div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm">
<div className="flex items-center justify-between mb-6">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary" data-icon="confirmation_number">confirmation_number</span>
<h2 className="text-xl font-bold font-headline">Issue New Token</h2>
</div>
{/* ABHA verify button */}
<button
  type="button"
  onClick={() => setShowAbha(v => !v)}
  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#003087] text-[#003087] text-xs font-bold hover:bg-blue-50 transition-colors"
>
  <span className="material-symbols-outlined text-sm">verified_user</span>
  {showAbha ? 'Hide ABHA' : 'Verify ABHA'}
</button>
</div>

{/* ABHA widget — shown inline above the form */}
{showAbha && (
  <div className="mb-5">
    <AbhaVerification onVerified={handleAbhaVerified} onClose={() => setShowAbha(false)} />
  </div>
)}

{/* ABHA auto-fill badge */}
{abhaAddress && (
  <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
    <span className="material-symbols-outlined text-[#003087] text-sm">verified</span>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-[#003087] uppercase tracking-wide">ABHA Verified</p>
      <p className="text-xs text-slate-600 font-mono truncate">{abhaAddress}</p>
    </div>
    <button onClick={() => setAbhaAddress('')} className="text-slate-400 hover:text-red-500 transition-colors">
      <span className="material-symbols-outlined text-sm">close</span>
    </button>
  </div>
)}

<form className="space-y-5" onSubmit={handleSubmit}>
<div className="space-y-1">
<label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide">Patient Name</label>
<input
  id="patient-name-input"
  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
  placeholder="Full legal name"
  type="text"
  value={patientName}
  onChange={e => setPatientName(e.target.value)}
  required
/>
</div>
<div className="grid grid-cols-2 gap-4">
<div className="space-y-1">
<label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide">Age</label>
<input
  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
  placeholder="Years"
  type="number"
  value={patientAge}
  onChange={e => setPatientAge(e.target.value)}
/>
</div>
<div className="space-y-1">
<label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide">Gender</label>
<select
  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
  value={patientGender}
  onChange={e => setPatientGender(e.target.value)}
>
<option>Select</option>
<option>Male</option>
<option>Female</option>
<option>Other</option>
</select>
</div>
</div>
<div className="space-y-1">
<label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide">WhatsApp Number (for alerts)</label>
<input
  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
  placeholder="+91XXXXXXXXXX"
  type="tel"
  value={patientPhone}
  onChange={e => setPatientPhone(e.target.value)}
/>
</div>
<div className="space-y-1">
<label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide">Department</label>
<select className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm">
<option>General OPD</option>
<option>Pediatrics</option>
<option>Cardiology</option>
<option>Orthopedics</option>
<option>Dermatology</option>
</select>
</div>
<div className="space-y-1">
<label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide">Doctor</label>
<select className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm">
<option>Dr. Ananya Sharma (Available)</option>
<option>Dr. Robert Miller (In Consultation)</option>
<option>Dr. Sarah Chen (On Break)</option>
</select>
</div>
<div className="space-y-2 pt-2">
<label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide">Priority Level</label>
<div className="grid grid-cols-3 gap-2">
<button className="py-2 text-xs font-bold rounded-lg border-2 border-primary bg-primary/5 text-primary" type="button">Normal</button>
<button className="py-2 text-xs font-bold rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container" type="button">Urgent</button>
<button className="py-2 text-xs font-bold rounded-lg border border-outline-variant text-on-surface-variant hover:bg-error/5 hover:text-error hover:border-error" type="button">Emergency</button>
</div>
</div>
{error && <p className="text-xs text-error font-semibold">{error}</p>}
{lastToken && (
  <div className="bg-secondary-container/30 border border-secondary/20 rounded-xl px-4 py-3 text-sm text-on-secondary-container font-semibold">
    ✓ Issued Token #{lastToken.tokenNumber} for {lastToken.patientName}
    {lastToken.syncStatus === 'pending_sync' && <span className="ml-2 text-amber-600">(offline – will sync)</span>}
  </div>
)}
<button
  className="w-full py-4 bg-primary text-white rounded-xl font-bold font-headline shadow-lg shadow-primary/30 hover:shadow-xl hover:translate-y-[-1px] transition-all mt-4 disabled:opacity-60"
  type="submit"
  disabled={submitting}
>
  {submitting ? 'Issuing…' : `Issue Token #${queue.length + 1}`}
</button>
</form>
</div>
<div className="mt-8 bg-tertiary-container/20 p-6 rounded-2xl border border-tertiary/10">
<div className="flex items-start gap-3">
<span className="material-symbols-outlined text-tertiary" data-icon="info">info</span>
<div>
<h4 className="font-bold text-tertiary text-sm">System Update</h4>
<p className="text-xs text-on-tertiary-fixed-variant leading-relaxed mt-1">
                                Orthopedic department currently has a 45min delay due to emergency surgeries. Advise walk-ins accordingly.
                            </p>
</div>
</div>
</div>
</aside>

<div className="xl:w-2/3 w-full space-y-6">
<div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
<div className="p-6 border-b border-surface-container flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
<div className="flex items-center gap-3">
<h2 className="text-xl font-bold font-headline">Live Queue List</h2>
<span className="px-2 py-0.5 bg-surface-container rounded text-xs font-bold text-on-surface-variant">{waitingQueue.length} Patients</span>
</div>
<div className="flex items-center gap-2">
<button className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors border border-outline-variant/30">
<span className="material-symbols-outlined text-sm" data-icon="filter_list">filter_list</span>
                                All Doctors
                            </button>
<button className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors border border-outline-variant/30">
<span className="material-symbols-outlined text-sm" data-icon="refresh">refresh</span>
                                Refresh
                            </button>
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left">
<thead>
<tr className="bg-surface-container-low text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
<th className="px-6 py-4">Token #</th>
<th className="px-6 py-4">Patient Name</th>
<th className="px-6 py-4">Status</th>
<th className="px-6 py-4">ETA</th>
<th className="px-6 py-4 text-right">Sync</th>
</tr>
</thead>
<tbody className="divide-y divide-surface-container">
{queue.length === 0 && (
  <tr>
    <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant text-sm">No patients in queue yet.</td>
  </tr>
)}
{queue.map((token, idx) => {
  const etaSec = token.estimatedWait || 0;
  const etaMin = Math.round(etaSec / 60);
  const isCalled = token.status === 'called';
  const isCompleted = token.status === 'completed';
  const isOffline = token.syncStatus === 'pending_sync';
  return (
    <tr key={token.tokenId} className={`transition-colors ${isCalled ? 'bg-primary/5 border-l-4 border-primary' : isCompleted ? 'opacity-50' : 'hover:bg-surface-container-low/50'}`}>
      <td className={`px-6 py-5 font-bold font-headline ${isCalled ? 'text-primary' : 'text-on-surface-variant'}`}>#{token.tokenNumber}</td>
      <td className="px-6 py-5">
        <div className="font-bold text-sm">{token.patientName}</div>
        <div className="text-[10px] text-on-surface-variant font-medium">{token.sessionId}</div>
      </td>
      <td className="px-6 py-5">
        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold ${
          isCalled ? 'bg-primary text-white'
          : isCompleted ? 'bg-surface-container text-on-surface-variant'
          : 'bg-surface-container text-on-surface-variant'
        }`}>
          {token.status.toUpperCase()}
        </span>
      </td>
      <td className="px-6 py-5 text-sm font-medium text-on-surface-variant">
        {isCalled ? 'At Door' : isCompleted ? '–' : etaMin > 0 ? `${etaMin}m` : '–'}
      </td>
      <td className="px-6 py-5 text-right">
        {isOffline && <span className="text-xs text-amber-600 font-bold">Pending</span>}
        {!isOffline && <span className="text-xs text-green-600 font-bold">Synced</span>}
      </td>
    </tr>
  );
})}
</tbody>
</table>
</div>
<div className="p-6 bg-surface-container-low flex justify-between items-center">
<p className="text-xs text-on-surface-variant font-medium">Showing {Math.min(queue.length, 12)} of {queue.length} patients</p>
<div className="flex gap-2">
<button className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
<button className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
</div>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 shadow-sm flex items-center gap-4">
<div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-primary">
<span className="material-symbols-outlined" data-icon="stethoscope">stethoscope</span>
</div>
<div>
<h4 className="font-bold text-sm">General OPD</h4>
<p className="text-xs text-on-surface-variant">{queue.filter(t=>t.status==='pending').length} Active • Avg. Wait: {Math.round(avgWaitSec)}m</p>
</div>
<div className="ml-auto">
<span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
</div>
</div>
<div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 shadow-sm flex items-center gap-4">
<div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined" data-icon="favorite">favorite</span>
</div>
<div>
<h4 className="font-bold text-sm">Cardiology</h4>
<p className="text-xs text-on-surface-variant">{emergencyCount} Emergency • Priority</p>
</div>
<div className="ml-auto">
<span className={`w-2 h-2 rounded-full ${emergencyCount > 0 ? 'bg-red-500' : 'bg-amber-500'} inline-block`}></span>
</div>
</div>
</div>
</div>
</div>
</main>

<footer className="lg:ml-64 w-full border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row justify-between items-center px-8 py-6 mt-auto">
<div className="flex flex-col md:flex-row gap-6 items-center">
<span className="font-['Public_Sans'] text-xs text-slate-500 dark:text-slate-400 font-bold text-slate-800 dark:text-slate-100">© 2026 SwasthQueue Hospital Systems. Demo v1.0.4</span>
<div className="flex gap-4">
<a className="font-['Public_Sans'] text-xs text-slate-500 dark:text-slate-400 hover:text-teal-600 transition-colors" href="#">Privacy Policy</a>
<a className="font-['Public_Sans'] text-xs text-slate-500 dark:text-slate-400 hover:text-teal-600 transition-colors" href="#">Support</a>
<a className="font-['Public_Sans'] text-xs text-slate-500 dark:text-slate-400 hover:text-teal-600 transition-colors" href="#">System Status</a>
</div>
</div>
<div className="mt-4 md:mt-0 flex items-center gap-2">
<span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-amber-400'}`}></span>
<span className="font-['Public_Sans'] text-xs text-slate-400">{isOnline ? 'All systems operational' : 'Offline mode'}</span>
</div>
</footer>

    </>
  );
}
