// Utilidad de audio no invasiva y agradable para notificaciones del sistema
export const playGentleChime = () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Tono doble armónico suave y agradable (sin pitidos agudos molestos)
    osc.type = 'sine';
    const now = ctx.currentTime;
    
    // Transición armónica limpia de Re5 (587 Hz) a La5 (880 Hz)
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.08);

    // Ganancia muy suave (0.05) con decaimiento natural y silencioso
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.33);
  } catch {
    // Si el navegador bloquea el audio previo a interacción del usuario, se ignora de forma segura
  }
};
