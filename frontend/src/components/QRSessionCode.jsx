import React, { useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';

// Always derive the base URL from the current browser origin at runtime.
// This means the QR code works correctly regardless of which IP/hostname
// the receptionist opened the app on — no env var needed.
function getCheckInUrl(sessionId) {
  if (!sessionId) return null;
  return `${window.location.origin}/patient/join/${sessionId}`;
}
/**
 * QRSessionCode — renders a QR code for the active session's patient check-in URL.
 *
 * Props:
 *   sessionId  string   — active session ID
 *   size       number   — QR pixel size (default 180)
 */
export default function QRSessionCode({ sessionId, size = 180 }) {
  const svgRef = useRef(null);
  const checkInUrl = getCheckInUrl(sessionId);

  const handleDownload = useCallback(() => {
    if (!svgRef.current || !checkInUrl) return;

    // Serialise SVG → canvas → PNG download
    const svg = svgRef.current.querySelector('svg');
    if (!svg) return;

    const serialised = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialised], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `swasthya-qr-${sessionId}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [checkInUrl, sessionId]);

  if (!sessionId) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">qr_code_2</span>
        <p className="text-xs text-on-surface-variant text-center font-medium">
          Start a session to generate the patient QR code
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col items-center gap-4">
      {/* Header */}
      <div className="flex items-center gap-2 self-start">
        <span className="material-symbols-outlined text-primary text-lg">qr_code_2</span>
        <h4 className="font-bold text-sm text-on-surface">Patient Check-In QR</h4>
      </div>

      {/* QR code */}
      <div
        ref={svgRef}
        className="p-3 bg-white rounded-xl border border-outline-variant/20 shadow-inner"
      >
        <QRCodeSVG
          value={checkInUrl}
          size={size}
          level="H"
          includeMargin={false}
          imageSettings={{
            src: '/favicon.svg',
            x: undefined,
            y: undefined,
            height: 28,
            width: 28,
            excavate: true,
          }}
        />
      </div>

      {/* URL hint */}
      <p className="text-[10px] text-on-surface-variant font-mono text-center break-all px-1 leading-relaxed">
        {checkInUrl}
      </p>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-primary/30 text-primary text-xs font-bold rounded-xl hover:bg-primary/5 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">download</span>
        Download / Print QR
      </button>
    </div>
  );
}
