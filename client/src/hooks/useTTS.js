import { useState, useCallback, useRef } from 'react';

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState(() => 'speechSynthesis' in window);
  const utterRef = useRef(null);

  const speak = useCallback((text, lang = 'ja-JP') => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang;
    utt.rate = 0.82;
    utt.pitch = 1.0;

    // Try to find a Japanese voice
    const voices = window.speechSynthesis.getVoices();
    const jpVoice = voices.find(v =>
      v.lang.startsWith('ja') && (v.name.includes('Google') || v.name.includes('Haruka') || v.localService)
    ) || voices.find(v => v.lang.startsWith('ja'));
    if (jpVoice) utt.voice = jpVoice;

    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    utterRef.current = utt;
    window.speechSynthesis.speak(utt);
  }, [supported]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, supported };
}
