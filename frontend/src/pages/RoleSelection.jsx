
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RoleSelection() {
  const navigate = useNavigate();
  return (
    <>
      

<main className="flex-grow flex flex-col items-center justify-center px-6 py-12">

<header className="text-center mb-16">
<div className="inline-flex items-center justify-center p-4 rounded-xl bg-surface-container-lowest surface-glow mb-6">
<span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: '\'wght\' 700' }}>local_hospital</span>
</div>
<h1 className="font-headline font-extrabold text-4xl text-primary tracking-tight mb-2">SwasthQueue</h1>
<p className="font-label text-on-surface-variant font-medium tracking-wide uppercase text-sm">OPD Management System</p>
</header>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl">

<div className="group relative flex flex-col items-center p-8 rounded-xl bg-surface-container-lowest border border-outline-variant/15 surface-glow transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
<div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center mb-8 transition-transform duration-300 group-hover:scale-110">
<span className="material-symbols-outlined text-primary text-4xl" data-icon="desk">desk</span>
</div>
<h2 className="font-headline font-bold text-2xl text-on-surface mb-4 text-center">Reception Panel</h2>
<p className="text-on-surface-variant text-center leading-relaxed mb-10 flex-grow">
                    Issue tokens and manage patient check-in. Streamline the initial contact point for all visitors.
                </p>
<button onClick={() => navigate('/reception')} className="w-full py-4 px-6 clinical-gradient text-white font-headline font-bold rounded-lg shadow-sm active:scale-95 transition-all">
                    Enter Reception
                </button>
</div>

<div className="group relative flex flex-col items-center p-8 rounded-xl bg-surface-container-lowest border border-outline-variant/15 surface-glow transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
<div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center mb-8 transition-transform duration-300 group-hover:scale-110">
<span className="material-symbols-outlined text-primary text-4xl" data-icon="stethoscope">stethoscope</span>
</div>
<h2 className="font-headline font-bold text-2xl text-on-surface mb-4 text-center">Doctor Panel</h2>
<p className="text-on-surface-variant text-center leading-relaxed mb-10 flex-grow">
                    Call patients and manage consultations. Efficiently view medical history and update queue status.
                </p>
<button onClick={() => navigate('/doctor')} className="w-full py-4 px-6 clinical-gradient text-white font-headline font-bold rounded-lg shadow-sm active:scale-95 transition-all">
                    Enter Doctor Panel
                </button>
</div>

<div className="group relative flex flex-col items-center p-8 rounded-xl bg-surface-container-lowest border border-outline-variant/15 surface-glow transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
<div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center mb-8 transition-transform duration-300 group-hover:scale-110">
<span className="material-symbols-outlined text-primary text-4xl" data-icon="monitor">monitor</span>
</div>
<h2 className="font-headline font-bold text-2xl text-on-surface mb-4 text-center">Patient Display</h2>
<p className="text-on-surface-variant text-center leading-relaxed mb-10 flex-grow">
                    Live queue status board for waiting areas. Provide transparency and reduce perceived wait times.
                </p>
<button onClick={() => navigate('/patient/demo')} className="w-full py-4 px-6 clinical-gradient text-white font-headline font-bold rounded-lg shadow-sm active:scale-95 transition-all">
                    Launch Status Board
                </button>
</div>

<div className="group relative flex flex-col items-center p-8 rounded-xl border-2 border-dashed border-teal-300 bg-gradient-to-br from-teal-50 to-emerald-50 surface-glow transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-teal-400">
<div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mb-8 transition-transform duration-300 group-hover:scale-110">
<span className="material-symbols-outlined text-teal-700 text-4xl" data-icon="map">map</span>
</div>
<h2 className="font-headline font-bold text-2xl text-teal-800 mb-4 text-center">Hospital Map</h2>
<div className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full mb-3">
  ⭐ Medical Migration
</div>
<p className="text-teal-700 text-center leading-relaxed mb-10 flex-grow">
                    Find nearby hospitals, compare affordability, check Ayushman eligibility &amp; get smart recommendations.
                </p>
<button onClick={() => navigate('/hospital-map')} className="w-full py-4 px-6 text-white font-headline font-bold rounded-lg shadow-sm active:scale-95 transition-all" style={{background: 'linear-gradient(135deg, #0d9488, #0f766e)'}}>
                    Explore Hospital Map
                </button>
</div>
</div>

<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-40">
<div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-fixed-dim/20 rounded-full blur-3xl"></div>
<div className="absolute top-1/2 -right-24 w-64 h-64 bg-secondary-fixed/30 rounded-full blur-3xl"></div>
</div>
</main>

<footer className="w-full border-t border-slate-100 bg-white px-8 py-6 mt-auto">
<div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
<div className="flex items-center space-x-4">
<span className="flex items-center space-x-2">
<span className="relative flex h-3 w-3">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
<span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
</span>
<span className="font-label text-xs text-on-surface-variant font-semibold">System Status: Online</span>
</span>
<span className="text-slate-300 h-4 border-l border-slate-300"></span>
<span className="font-label text-xs text-slate-500">Version 1.0.4</span>
</div>
<div className="flex items-center space-x-6">
<a className="font-label text-xs text-slate-400 hover:text-teal-600 transition-colors" href="#">Privacy Policy</a>
<a className="font-label text-xs text-slate-400 hover:text-teal-600 transition-colors" href="#">Support</a>
<a className="font-label text-xs text-slate-400 hover:text-teal-600 transition-colors" href="#">System Status</a>
</div>
<p className="font-label text-xs text-slate-500">
                © 2024 SwasthQueue Hospital Systems
            </p>
</div>
</footer>

    </>
  );
}
