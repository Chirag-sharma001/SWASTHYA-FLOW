import React from 'react';

/**
 * SyncStatusBadge — header badge showing online / offline / syncing state.
 * Three states:
 *   online   → green dot + "Online"
 *   offline  → yellow dot + "Saving Locally"
 *   syncing  → pulsing orange dot + "Syncing…"
 */
export default function SyncStatusBadge({ isOnline, syncing }) {
  if (syncing) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold">
        <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping inline-block" />
        <span className="w-2 h-2 rounded-full bg-orange-500 -ml-3.5 inline-block" />
        Syncing…
      </span>
    );
  }

  if (!isOnline) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
        Saving Locally
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
      Online
    </span>
  );
}
