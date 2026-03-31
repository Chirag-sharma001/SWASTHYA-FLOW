import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../hooks/useQueue';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDate(ts) {
  if (!ts) return '–';
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDuration(secs) {
  if (!secs) return '–';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

export default function DoctorConsultationHistory() {
  const navigate = useNavigate();
  const { queue, session, isOnline } = useQueue();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const doctorName = session?.doctorName ?? 'Dr. Ananya Sharma';
  const completed = queue.filter(t => t.status === 'completed');
  const durations = session?.consultationDurations ?? [];
  const avgDur = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60 * 10) / 10
    : 0;

  // Volume by day of week (from completed tokens)
  const volumeByDay = useMemo(() => {
    const map = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    completed.forEach(t => {
      const d = new Date(t.createdAt).getDay();
      map[d] = (map[d] || 0) + 1;
    });
    return DAYS.map((label, i) => ({ label, count: map[i] }));
  }, [completed]);
  const maxVol = Math.max(...volumeByDay.map(d => d.count), 1);

  // Filtered list
  const filtered = useMemo(() => {
    return [...queue]
      .filter(t => {
        if (statusFilter === 'completed') return t.status === 'completed';
        if (statusFilter === 'pending')   return t.status === 'pending';
        return true;
      })
      .filter(t =>
        t.patientName?.toLowerCase().includes(search.toLowerCase()) ||
        String(t.tokenNumber).includes(search)
      )
      .reverse();
  }, [queue, search, statusFilter]);

  const statusBadge = status => {
    if (status === 'completed') return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
    if (status === 'called')    return 'bg-primary/10 text-primary';
    return 'bg-amber-100 text-amber-700';
  };

  return (
    <>
      {/* ── Sidebar ── */}
      <nav className="bg-slate-50 dark:bg-slate-950 h-screen w-64 fixed left-0 top-0 hidden lg:flex flex-col font-['Public_Sans'] text-sm font-medium border-r border-outline-variant/20 z-[60]">
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

          <a className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 mx-2 my-1 flex items-center gap-3 px-3 py-2.5 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200 ease-in-out rounded-lg"
            href="#" onClick={e => { e.preventDefault(); navigate('/doctor'); }}>
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </a>

          <a className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 mx-2 my-1 flex items-center gap-3 px-3 py-2.5 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200 ease-in-out rounded-lg"
            href="#" onClick={e => { e.preventDefault(); navigate('/doctor'); }}>
            <span className="material-symbols-outlined">queue</span>
            <span>Queue</span>
          </a>

          {/* Active */}
          <a className="bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm rounded-lg mx-2 my-1 flex items-center gap-3 px-3 py-2.5"
            href="#" onClick={e => e.preventDefault()}>
            <span className="material-symbols-outlined">history_edu</span>
            <span>Consultation History</span>
          </a>

          <a className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 mx-2 my-1 flex items-center gap-3 px-3 py-2.5 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200 ease-in-out rounded-lg"
            href="#">
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </a>

          <div className="mt-auto px-2">
            <button
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md"
              onClick={() => navigate('/doctor')}
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Panel
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="lg:ml-64 min-h-screen flex flex-col bg-surface-container-low">

        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm sticky top-0 z-50 flex justify-between items-center px-8 py-4">
          <div>
            <h1 className="font-headline font-extrabold text-2xl text-teal-700 dark:text-teal-400 tracking-tight leading-none">
              Consultation History
            </h1>
            <p className="text-xs text-on-surface-variant mt-1 font-medium">
              {doctorName} &nbsp;·&nbsp; Reviewing {completed.length} consultations
            </p>
          </div>
          <div className="flex items-center gap-4">
            {!isOnline && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-md border border-amber-300">OFFLINE</span>
            )}
            <button
              onClick={() => navigate('/doctor')}
              className="lg:hidden p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-[1400px] w-full mx-auto">

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Consults</p>
              <p className="text-4xl font-black text-on-surface font-headline">{queue.length}</p>
              <p className="text-xs text-on-surface-variant mt-1">All time this session</p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Avg. Duration</p>
              <p className="text-4xl font-black text-on-surface font-headline">{avgDur ? `${avgDur}m` : '–'}</p>
              <p className="text-xs text-on-surface-variant mt-1">Per consultation</p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Completed Today</p>
              <p className="text-4xl font-black text-on-surface font-headline">{completed.length}</p>
              <p className="text-on-surface-variant text-xs mt-1">
                {completed.length > 0 ? `${completed.length} patient${completed.length > 1 ? 's' : ''} seen` : 'None yet'}
              </p>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-8">

            {/* ── Volume Chart ── */}
            <div className="xl:w-72 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 p-6 flex-shrink-0">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">Volume (7 Days)</p>
              <div className="flex items-end gap-2 h-32">
                {volumeByDay.map(({ label, count }) => (
                  <div key={label} className="flex flex-col items-center flex-1 gap-1">
                    <span className="text-[9px] text-on-surface-variant font-bold">{count || ''}</span>
                    <div
                      className="w-full bg-primary/70 rounded-t-md transition-all duration-500"
                      style={{ height: `${(count / maxVol) * 100}%`, minHeight: count ? 4 : 2, opacity: count ? 1 : 0.2 }}
                    />
                    <span className="text-[10px] text-on-surface-variant">{label}</span>
                  </div>
                ))}
              </div>

              {/* Today's summary callout */}
              {completed.length > 0 && (
                <div className="mt-6 p-4 bg-primary/5 border border-primary/10 rounded-xl">
                  <p className="text-xs font-bold text-primary">
                    You've treated {completed.length} patient{completed.length > 1 ? 's' : ''} today.
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-1">Keep it up!</p>
                </div>
              )}
            </div>

            {/* ── Consultation Table ── */}
            <div className="flex-1 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
              {/* Filters */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">history_edu</span>
                  <h2 className="text-lg font-bold font-headline">All Records</h2>
                  <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded text-xs font-bold">
                    {filtered.length}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {/* Search */}
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
                    <input
                      className="pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-sm focus:ring-2 focus:ring-primary w-48 transition-all"
                      placeholder="Search patient…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  {/* Status filter */}
                  <select
                    className="px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                  {(search || statusFilter !== 'all') && (
                    <button
                      className="px-3 py-2 text-xs font-bold text-on-surface-variant hover:text-error transition-colors border border-outline-variant/30 rounded-lg"
                      onClick={() => { setSearch(''); setStatusFilter('all'); }}
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container-low text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Token</th>
                      <th className="px-6 py-4">Patient Name</th>
                      <th className="px-6 py-4">Priority</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Session</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-on-surface-variant">
                          No consultations found.
                        </td>
                      </tr>
                    )}
                    {filtered.map(token => (
                      <tr key={token.tokenId} className="hover:bg-surface-container-low/60 transition-colors group">
                        <td className="px-6 py-4 text-xs text-on-surface-variant font-medium whitespace-nowrap">
                          {formatDate(token.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-black text-on-surface-variant font-headline">
                            T-{token.tokenNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-sm text-on-surface">{token.patientName}</div>
                          <div className="text-[10px] text-on-surface-variant">{token.tokenId?.slice(0, 8)}…</div>
                        </td>
                        <td className="px-6 py-4">
                          {token.priority === 'emergency' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                              <span className="material-symbols-outlined text-xs">emergency</span> EMERGENCY
                            </span>
                          ) : (
                            <span className="text-xs text-on-surface-variant font-medium capitalize">
                              {token.priority ?? 'Normal'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold ${statusBadge(token.status)}`}>
                            {token.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-on-surface-variant font-medium">
                          {token.sessionId ?? '–'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-5 bg-surface-container-low border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <p className="text-xs text-on-surface-variant font-medium">
                  Showing {filtered.length} of {queue.length} records
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto">
          <div className="flex flex-col md:flex-row justify-between items-center px-8 py-6 w-full">
            <p className="font-['Public_Sans'] text-xs text-slate-500">© 2024 SwasthQueue Hospital Systems. Demo v1.0.4</p>
            <div className="mt-4 md:mt-0 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-amber-400'}`} />
              <span className="font-['Public_Sans'] text-xs text-slate-400">
                {isOnline ? 'All systems operational' : 'Offline mode'}
              </span>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
