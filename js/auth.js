import {
  getSettings,
  saveSettings
} from "./storage.js";

const SESSION_KEY = "passtrack_admin_authed";

const DEFAULT_PIN = "9999";

export async function hashPin(pin) {
  const encoded =
    new TextEncoder().encode(String(pin));

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      encoded
    );

  return Array.from(
    new Uint8Array(digest)
  )
    .map(byte =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}

export async function initializeAdminPin() {
  const settings = getSettings();

  if (!settings.adminPinHash) {
    settings.adminPinHash =
      await hashPin(DEFAULT_PIN);

    saveSettings(settings);
  }
}

export function isAdminAuthenticated() {
  return (
    sessionStorage.getItem(SESSION_KEY) === "true"
  );
}

export async function authenticate(pin) {
  const settings = getSettings();

  const hash = await hashPin(pin);

  if (hash !== settings.adminPinHash) {
    return false;
  }

  sessionStorage.setItem(
    SESSION_KEY,
    "true"
  );

  return true;
}

export async function verifyPin(pin) {
  const settings = getSettings();

  return (
    await hashPin(pin)
  ) === settings.adminPinHash;
}

export async function changePin(
  currentPin,
  newPin
) {
  const valid =
    await verifyPin(currentPin);

  if (!valid) {
    throw new Error("Current PIN is incorrect.");
  }

  if (!/^\d{4,20}$/.test(newPin)) {
    throw new Error(
      "PIN must contain 4–20 digits."
    );
  }

  saveSettings({
    adminPinHash:
      await hashPin(newPin)
  });
}

export function lockAdmin() {
  sessionStorage.removeItem(SESSION_KEY);

  window.location.replace("./index.html");
}

let idleTimer = null;

export function startAdminIdleLock() {
  if (!isAdminAuthenticated()) {
    return;
  }

  const timeout = 120000;

  function reset() {
    clearTimeout(idleTimer);

    idleTimer = setTimeout(() => {
      lockAdmin();
    }, timeout);
  }

  [
    "mousemove",
    "keydown",
    "touchstart"
  ].forEach(event => {
    window.addEventListener(
      event,
      reset,
      { passive: true }
    );
  });

  reset();
}