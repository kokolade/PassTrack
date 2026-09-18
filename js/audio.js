let audioContext = null;

function getContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function tone(
  frequency,
  startTime,
  duration,
  volume = 0.18
) {
  const ctx = getContext();

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(
    0.0001,
    startTime
  );

  gain.gain.exponentialRampToValueAtTime(
    volume,
    startTime + 0.015
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    startTime + duration
  );

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

export function successSound() {
  const ctx = getContext();

  tone(
    800,
    ctx.currentTime,
    0.18,
    0.2
  );
}

export function errorSound() {
  const ctx = getContext();

  tone(
    200,
    ctx.currentTime,
    0.12,
    0.2
  );

  tone(
    200,
    ctx.currentTime + 0.16,
    0.12,
    0.2
  );
}