import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function EmergencyView() {
  const { tokenId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Use relative URL so Vite proxy handles it — works on localhost AND LAN IPs
    fetch(`/api/tokens/emergency/${tokenId}`)
      .then(res => {
        if (!res.ok) throw new Error('Token not found or invalid ID');
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message));
  }, [tokenId]);

  return (
    <div className="min-h-screen bg-rose-50 dark:bg-slate-950 flex items-center justify-center p-6 font-['Public_Sans']">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 max-w-md w-full border-t-8 border-error relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-error/5 rounded-bl-full -z-10"></div>
        <div className="flex items-center gap-3 mb-8 text-error">
          <span className="material-symbols-outlined text-4xl animate-pulse">emergency</span>
          <h1 className="text-2xl font-black font-headline uppercase tracking-widest">Medical Alert</h1>
        </div>
        
        {error ? (
          <div className="bg-error/10 p-4 rounded-xl border border-error/20">
            <p className="text-error font-bold">{error}</p>
          </div>
        ) : !data ? (
           <p className="text-slate-500 font-bold animate-pulse text-center py-10">Scanning Database...</p>
        ) : (
          <div className="space-y-8 relative z-10">
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Patient Name</p>
              <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{data.patientName}</p>
            </div>
            
            <div className="bg-rose-100/50 dark:bg-rose-900/20 p-6 rounded-2xl border border-rose-200 dark:border-rose-800/50 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider">Blood Group</p>
                <p className="text-5xl font-black text-rose-600 dark:text-rose-500 mt-1 drop-shadow-sm">{data.bloodGroup}</p>
              </div>
              <span className="material-symbols-outlined text-6xl text-rose-200 dark:text-rose-900/50">bloodtype</span>
            </div>
            
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Emergency Contact</p>
              <a href={`tel:${data.emergencyContact}`} className="text-2xl font-bold flex items-center gap-3 group">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">call</span>
                </div>
                <span className="text-primary group-hover:underline underline-offset-4">{data.emergencyContact}</span>
              </a>
            </div>
            
            <button onClick={() => window.print()} className="print:hidden w-full py-4 mt-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold font-headline flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <span className="material-symbols-outlined text-sm">print</span>
              Save Health Passport to PDF
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400">Swasthya-Shield Secure Protocol</p>
        </div>
      </div>
    </div>
  );
}
