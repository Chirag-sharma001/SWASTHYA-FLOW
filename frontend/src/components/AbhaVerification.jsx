import React, { useState } from 'react';
import { apiService } from '../services/apiService';

/**
 * AbhaVerification
 *
 * Two modes:
 *   'otp'  — enter mobile/ABHA ID → get OTP → verify → auto-fill form
 *   'qr'   — paste/scan a JSON string representing an ABHA QR payload
 *
 * Props:
 *   onVerified(profile) — called with { name, age, gender, yearOfBirth, abhaAddress }
 *   onClose()           — called when the user dismisses the widget
 */
export default function AbhaVerification({ onVerified, onClose }) {
  const [mode, setMode] = useState('otp'); // 'otp' | 'qr'

  // OTP flow state
  const [mobileOrAbha, setMobileOrAbha] = useState('');
  const [transactionId, setTransactionId] = useState(null);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // QR flow state
  const [qrInput, setQrInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hint, setHint] = useState(null);

  // ── OTP flow ──────────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!mobileOrAbha.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.abhaGenerateOtp(mobileOrAbha.trim());
      setTransactionId(res.transactionId);
      setOtpSent(true);
      setHint(res.message);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.abhaVerifyOtp(transactionId, otp.trim());
      onVerified(res.profile);
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // ── QR / Health ID scan simulation ───────────────────────────────────────
  /**
   * handleAbhaScan — parses a JSON string from a scanned ABHA QR code.
   * Expected format:
   * {"name":"Rahul Sharma","age":34,"gender":"Male","yearOfBirth":1990,"abhaAddress":"rahul.sharma@abdm"}
   */
  const handleAbhaScan = (qrData) => {
    try {
      const parsed = JSON.parse(qrData);
      if (!parsed.name) throw new Error('Invalid ABHA QR data');
      onVerified({
        name: parsed.name,
        age: parsed.age ?? null,
        gender: parsed.gender ?? null,
        yearOfBirth: parsed.yearOfBirth ?? null,
        abhaAddress: parsed.abhaAddress ?? null,
      });
    } catch {
      setError('Invalid QR data. Paste a valid ABHA JSON string.');
    }
  };

  const handleQrSubmit = (e) => {
    e.preventDefault();
    handleAbhaScan(qrInput.trim());
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-white overflow-hidden shadow-lg">

      {/* ABDM Header bar */}
      <div className="bg-gradient-to-r from-[#003087] to-[#0057b8] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* ABDM logo mark */}
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <span className="text-[#003087] font-black text-xs leading-none">AB</span>
          </div>
          <div>
            <p className="text-white font-black text-sm leading-tight tracking-wide">ABDM</p>
            <p className="text-blue-200 text-[9px] font-bold uppercase tracking-widest leading-none">
              Ayushman Bharat Digital Mission
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-blue-200 hover:text-white transition-colors p-1"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {/* Mode tabs */}
      <div className="flex border-b border-blue-100">
        <button
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5 ${
            mode === 'otp'
              ? 'text-[#003087] border-b-2 border-[#003087] bg-blue-50'
              : 'text-slate-500 hover:text-[#003087]'
          }`}
          onClick={() => { setMode('otp'); setError(null); }}
        >
          <span className="material-symbols-outlined text-sm">smartphone</span>
          Mobile / ABHA ID
        </button>
        <button
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5 ${
            mode === 'qr'
              ? 'text-[#f47920] border-b-2 border-[#f47920] bg-orange-50'
              : 'text-slate-500 hover:text-[#f47920]'
          }`}
          onClick={() => { setMode('qr'); setError(null); }}
        >
          <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
          Scan Health ID QR
        </button>
      </div>

      <div className="p-5 space-y-4">

        {/* ── OTP Mode ── */}
        {mode === 'otp' && (
          <>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Mobile Number or ABHA Address
                  </label>
                  <input
                    className="w-full px-3 py-2.5 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-[#003087] focus:border-[#003087] transition-all"
                    placeholder="e.g. 9999999999 or rahul@abdm"
                    value={mobileOrAbha}
                    onChange={e => setMobileOrAbha(e.target.value)}
                    required
                  />
                  <p className="text-[10px] text-slate-400">Demo numbers: 9999999999 · 8888888888 · 7777777777</p>
                </div>
                {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#003087] text-white rounded-lg text-sm font-bold hover:bg-[#002070] transition-colors disabled:opacity-60"
                >
                  {loading ? 'Sending…' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                {hint && (
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    <span className="material-symbols-outlined text-[#003087] text-sm mt-0.5">info</span>
                    <p className="text-xs text-[#003087] font-medium">{hint}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Enter OTP
                  </label>
                  <input
                    className="w-full px-3 py-2.5 border border-blue-200 rounded-lg text-sm text-center tracking-[0.5em] font-bold focus:ring-2 focus:ring-[#003087] focus:border-[#003087] transition-all"
                    placeholder="• • • • • •"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                  />
                </div>
                {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); setError(null); setHint(null); }}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="flex-1 py-2.5 bg-[#003087] text-white rounded-lg text-sm font-bold hover:bg-[#002070] transition-colors disabled:opacity-60"
                  >
                    {loading ? 'Verifying…' : 'Verify OTP'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* ── QR Mode ── */}
        {mode === 'qr' && (
          <form onSubmit={handleQrSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Paste ABHA QR Data (JSON)
              </label>
              <textarea
                className="w-full px-3 py-2.5 border border-orange-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#f47920] focus:border-[#f47920] transition-all resize-none"
                rows={4}
                placeholder={`{"name":"Rahul Sharma","age":34,"gender":"Male","yearOfBirth":1990,"abhaAddress":"rahul.sharma@abdm"}`}
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                required
              />
              <p className="text-[10px] text-slate-400">
                In production this is auto-filled by the camera scanner.
              </p>
            </div>

            {/* Demo fill button */}
            <button
              type="button"
              onClick={() => setQrInput('{"name":"Priya Patel","age":28,"gender":"Female","yearOfBirth":1996,"abhaAddress":"priya.patel@abdm"}')}
              className="w-full py-2 border border-orange-200 text-[#f47920] rounded-lg text-xs font-bold hover:bg-orange-50 transition-colors"
            >
              Load Demo QR Data
            </button>

            {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

            <button
              type="submit"
              className="w-full py-2.5 bg-[#f47920] text-white rounded-lg text-sm font-bold hover:bg-[#d4661a] transition-colors"
            >
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                Verify Health ID
              </span>
            </button>
          </form>
        )}

        {/* Footer */}
        <p className="text-center text-[9px] text-slate-400 pt-1">
          Secured by NHA · Ayushman Bharat Digital Mission · Mock Integration
        </p>
      </div>
    </div>
  );
}
