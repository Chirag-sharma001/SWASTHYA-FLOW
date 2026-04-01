import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOfflineSync } from '../hooks/useOfflineSync';

export default function DailySummary() {
  const navigate = useNavigate();
  const { queue, session, isOnline, syncing } = useOfflineSync();

  const completed = queue.filter(t => t.status === 'completed');
  const pending   = queue.filter(t => t.status === 'pending');
  const called    = queue.filter(t => t.status === 'called');
  const emergency = queue.filter(t => t.priority === 'emergency');

  const durations = session?.consultationDurations ?? [];
  const avgConsult = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60)
    : 0;

  const byHour = useMemo(() => {
    const map = {};
    queue.forEach(t => {
      const h = new Date(t.createdAt).getHours();
      const label = `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => {
      const toNum = s => {
        const pm = s.endsWith('pm');
        const h  = parseInt(s);
        return pm ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
      };
      return toNum(a[0]) - toNum(b[0]);
    });
  }, [queue]);

  const maxCount = byHour.length ? Math.max(...byHour.map(([, c]) => c)) : 1;

  const statusBadge = status => {
    if (status === 'completed') return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
    if (status === 'called')    return 'bg-primary/10 text-primary';
    return 'bg-surface-container text-on-surface-variant';
  };

  return (
    <>
      {/* ── Header ── */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm fixed top-0 left-0 lg:left-64 right-0 z-50 flex justify-between items-center px-6 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/reception')}
            className="lg:hidden p-1 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </button>
          <h1 className="font-['Manrope'] font-semibold text-lg text-teal-700 dark:text-teal-400">
            Daily Summary &amp; History
          </h1>
          {!isOnline && (
            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-md border border-amber-300">
              OFFLINE{syncing ? ' · Syncing…' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 pl-4 border-l border-outline-variant/30">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold leading-none">Sarah Jenkins</p>
            <p className="text-xs text-on-surface-variant">Chief Receptionist</p>
          </div>
          <span className="material-symbols-outlined text-3xl text-primary">account_circle</span>
        </div>
      </header>

      {/* ── Sidebar ── */}
      <nav className="bg-slate-50 dark:bg-slate-950 h-screen w-64 fixed left-0 top-0 hidden lg:flex flex-col py-6 px-4 space-y-2 z-[60]">
        <div className="px-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
              <span className="material-symbols-outlined">medical_services</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-teal-800 dark:text-teal-200 tracking-tight">SwasthQueue</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">OPD Management</p>
            </div>
          </div>
        </div>
        <div className="flex-grow space-y-1">
          <a
            className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200 ease-in-out rounded-lg font-['Public_Sans'] text-sm font-medium mx-2 my-1"
            href="#"
            onClick={e => { e.preventDefault(); navigate('/'); }}
          >
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200 ease-in-out rounded-lg font-['Public_Sans'] text-sm font-medium mx-2 my-1"
            href="#"
            onClick={e => { e.preventDefault(); navigate('/reception'); }}
          >
            <span className="material-symbols-outlined">queue</span>
            Queue
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm rounded-lg mx-2 my-1 font-['Public_Sans'] text-sm font-semibold"
            href="#"
            onClick={e => e.preventDefault()}
          >
            <span className="material-symbols-outlined">history</span>
            History
          </a>
          <a
            className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200 ease-in-out rounded-lg font-['Public_Sans'] text-sm font-medium mx-2 my-1"
            href="#"
          >
            <span className="material-symbols-outlined">settings</span>
            Settings
          </a>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="lg:ml-64 pt-20 px-6 pb-12 min-h-screen">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Today',   value: queue.length,     icon: 'confirmation_number', color: 'text-teal-600',  bg: 'bg-teal-50 dark:bg-teal-900/20' },
            { label: 'Completed',     value: completed.length, icon: 'check_circle',        color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
            { label: 'Still Waiting', value: pending.length + called.length, icon: 'hourglass_top', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Emergency',     value: emergency.length, icon: 'emergency',           color: 'text-red-600',   bg: 'bg-red-50 dark:bg-red-900/20' },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-transparent hover:border-primary/10 transition-all">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
              <div className="flex items-end justify-between">
                <h3 className="text-3xl font-bold font-headline text-on-surface">{value}</h3>
                <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col xl:flex-row gap-8">

          {/* ── Hourly Bar Chart ── */}
          <div className="xl:w-1/3 bg-surface-container-lowest rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">bar_chart</span>
              <h2 className="text-lg font-bold font-headline">Tokens by Hour</h2>
            </div>
            {byHour.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-8">No data yet for today.</p>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {byHour.map(([hour, count]) => (
                  <div key={hour} className="flex flex-col items-center flex-1 gap-1">
                    <span className="text-[10px] text-on-surface-variant font-bold">{count}</span>
                    <div
                      className="w-full bg-primary/80 rounded-t-md transition-all duration-500"
                      style={{ height: `${(count / maxCount) * 100}%`, minHeight: 4 }}
                    />
                    <span className="text-[10px] text-on-surface-variant">{hour}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-surface-container">
              <div className="flex justify-between text-xs text-on-surface-variant font-medium">
                <span>Avg. Consult Time</span>
                <span className="font-bold text-on-surface">{avgConsult ? `${avgConsult}m` : '–'}</span>
              </div>
            </div>
          </div>

          {/* ── Full Token History Table ── */}
          <div className="xl:w-2/3 bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-surface-container flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">history</span>
                <h2 className="text-xl font-bold font-headline">All Tokens</h2>
                <span className="px-2 py-0.5 bg-surface-container rounded text-xs font-bold text-on-surface-variant">
                  {queue.length} total
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                    <th className="px-6 py-4">Token #</th>
                    <th className="px-6 py-4">Patient Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Session</th>
                    <th className="px-6 py-4 text-right">Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {queue.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-on-surface-variant text-sm">
                        No tokens issued today.
                      </td>
                    </tr>
                  )}
                  {[...queue].reverse().map(token => (
                    <tr key={token.tokenId} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4 font-bold font-headline text-on-surface-variant">
                        #{token.tokenNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm">{token.patientName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold ${statusBadge(token.status)}`}>
                          {token.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {token.priority === 'emergency' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                            EMERGENCY
                          </span>
                        ) : (
                          <span className="text-xs text-on-surface-variant font-medium capitalize">
                            {token.priority ?? 'Normal'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant font-medium">
                        {token.sessionId ?? '–'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {token.syncStatus === 'pending_sync'
                          ? <span className="text-xs text-amber-600 font-bold">Pending</span>
                          : <span className="text-xs text-green-600 font-bold">Synced</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="lg:ml-64 w-full border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row justify-between items-center px-8 py-6">
        <span className="font-['Public_Sans'] text-xs text-slate-500 dark:text-slate-400 font-bold">
          © 2024 SwasthQueue Hospital Systems. Demo v1.0.4
        </span>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-amber-400'}`} />
          <span className="font-['Public_Sans'] text-xs text-slate-400">
            {isOnline ? 'All systems operational' : 'Offline mode'}
          </span>
        </div>
      </footer>
    </>
  );
}
