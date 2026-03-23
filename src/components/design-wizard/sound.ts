/**
 * Sound system — Pachelbel's Canon piano notes.
 * Each step selection plays the next note in the progression.
 * D4, A4, B4, F#4, G4, D5, G4, A4
 */

let audioCtx: AudioContext | null = null;
let isMuted = true;
let noteIndex = 0;

// Pachelbel's Canon note progression (frequencies in Hz)
const CANON_NOTES = [
  293.66, // D4
  440.0,  // A4
  493.88, // B4
  369.99, // F#4
  392.0,  // G4
  587.33, // D5
  392.0,  // G4
  440.0,  // A4
];

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function initSound() {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem("tc-sound-muted");
  isMuted = stored === null ? true : stored === "true";

  window.addEventListener("tc-mute-toggle", ((e: CustomEvent) => {
    isMuted = e.detail.muted;
  }) as EventListener);
}

function playPianoNote(freq: number, volume = 0.12) {
  if (isMuted) return;
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Fundamental
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.value = freq;
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(volume, now + 0.005);
  gain1.gain.exponentialRampToValueAtTime(volume * 0.3, now + 0.3);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  osc1.connect(gain1).connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.85);

  // 2nd partial (octave above, quieter)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.value = freq * 2;
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.linearRampToValueAtTime(volume * 0.3, now + 0.005);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  osc2.connect(gain2).connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + 0.55);

  // 3rd partial (very quiet, adds shimmer)
  const osc3 = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.type = "sine";
  osc3.frequency.value = freq * 3;
  gain3.gain.setValueAtTime(0, now);
  gain3.gain.linearRampToValueAtTime(volume * 0.1, now + 0.005);
  gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc3.connect(gain3).connect(ctx.destination);
  osc3.start(now);
  osc3.stop(now + 0.35);
}

/** Play the next note in Pachelbel's Canon progression */
export function playClick() {
  const freq = CANON_NOTES[noteIndex % CANON_NOTES.length];
  playPianoNote(freq);
  noteIndex++;
}

/** Soft transition — gentle high note */
export function playWhoosh() {
  // Skip the whoosh sound — just advance the note
}

/** Tile added — same as click but slightly louder */
export function playPop() {
  // No separate sound — the click handles it
}

/** Success — play a two-note resolution (D5 + A5) */
export function playSuccess() {
  if (isMuted) return;
  playPianoNote(587.33, 0.1); // D5
  setTimeout(() => playPianoNote(880.0, 0.08), 200); // A5
}

/** Reset note sequence (e.g., when restarting wizard) */
export function resetNotes() {
  noteIndex = 0;
}
