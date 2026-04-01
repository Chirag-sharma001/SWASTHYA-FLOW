import { useEffect, useRef, useCallback } from 'react';

/**
 * useVoiceAnnouncement
 *
 * Robust Web Speech API hook for mobile browsers.
 *
 * Mobile browsers (Chrome Android, Safari iOS) block speechSynthesis until
 * the user has interacted with the page. This hook:
 *   1. Tracks whether audio has been unlocked via user interaction
 *   2. Queues any announcement made before unlock and plays it after
 *   3. Uses a workaround for Chrome Android's speechSynthesis bug (pauses after ~15s)
 */
export function useVoiceAnnouncement(enabled) {
  const unlockedRef = useRef(false);
  const pendingRef = useRef(null); // queued utterance text waiting for unlock

  // Mark audio as unlocked on any user interaction
  const unlock = useCallback(() => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;
    console.log('[Voice] Audio unlocked via user interaction');

    // Speak a zero-length utterance to fully activate speechSynthesis on mobile
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }

    // If there's a queued announcement, play it now
    if (pendingRef.current) {
      const { text, lang } = pendingRef.current;
      pendingRef.current = null;
      console.log('[Voice] Playing queued announcement');
      setTimeout(() => speakText(text, lang), 300);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const events = ['touchstart', 'touchend', 'click', 'keydown', 'pointerdown'];
    events.forEach(ev => document.addEventListener(ev, unlock, { once: true, passive: true }));
    return () => events.forEach(ev => document.removeEventListener(ev, unlock));
  }, [unlock]);

  // Chrome Android bug: speechSynthesis stops after ~15s unless we keep it alive
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.speechSynthesis?.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  function speakText(text, lang = 'hi-IN') {
    if (!('speechSynthesis' in window)) {
      console.log('[Voice] speechSynthesis not available');
      return;
    }
    
    console.log('[Voice] speakText called:', { text, lang });
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.82;
    utter.pitch = 1;
    utter.volume = 1;

    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('[Voice] Available voices:', voices.length);
      const hindi = voices.find(v => v.lang === 'hi-IN' || v.lang.startsWith('hi'));
      if (hindi) {
        console.log('[Voice] Hindi voice found:', hindi.name);
        utter.voice = hindi;
      } else {
        console.log('[Voice] No Hindi voice found, using default');
      }
      console.log('[Voice] Speaking...');
      window.speechSynthesis.speak(utter);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      setVoiceAndSpeak();
    } else {
      // Voices not loaded yet (common on first load)
      console.log('[Voice] Voices not loaded, waiting for voiceschanged event');
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        setVoiceAndSpeak();
      };
    }
  }

  /**
   * announce — speaks token number and patient name in Hindi
   * If audio not yet unlocked (user hasn't interacted), queues it for later
   */
  const announce = useCallback((tokenNumber, patientName, room = 'Doctor Room') => {
    if (!enabled) {
      console.log('[Voice] Announcement skipped - voice disabled');
      return;
    }

    console.log('[Voice] Announcing:', { tokenNumber, patientName, room, unlockedRef: unlockedRef.current });

    const text = `ध्यान दें। टोकन नंबर ${tokenNumber}, ${patientName}, कृपया ${room} में आएं। ध्यान दें। टोकन नंबर ${tokenNumber}।`;

    if (!unlockedRef.current) {
      // Queue it — will fire as soon as user taps anything
      console.log('[Voice] Audio not unlocked yet, queueing announcement');
      pendingRef.current = { text, lang: 'hi-IN' };
      return;
    }

    console.log('[Voice] Speaking now');
    speakText(text, 'hi-IN');
  }, [enabled]);

  return { announce, unlock };
}
