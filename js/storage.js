const STAFF_KEY = "passtrack_staff";
const LOGS_KEY = "passtrack_logs";
const SETTINGS_KEY = "passtrack_settings";

const DEFAULT_SETTINGS = {
  schemaVersion: 1,
  adminPinHash: null
};

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return fallback;
    }

    return JSON.parse(value);
  } catch (error) {
    console.error("PassTrack storage error:", error);
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getStaff() {
  return read(STAFF_KEY, []);
}

export function saveStaff(staff) {
  write(STAFF_KEY, staff);
}

export function getLogs() {
  return read(LOGS_KEY, []);
}

export function saveLogs(logs) {
  write(LOGS_KEY, logs);
}

export function getSettings() {
  return {
    ...DEFAULT_SETTINGS,
    ...read(SETTINGS_KEY, {})
  };
}

export function saveSettings(settings) {
  write(SETTINGS_KEY, {
    ...getSettings(),
    ...settings
  });
}

export function addStaff(employee) {
  const staff = getStaff();

  const exists = staff.some(
    person =>
      person.id.toUpperCase() === employee.id.toUpperCase()
  );

  if (exists) {
    throw new Error("Employee ID already exists.");
  }

  staff.push(employee);
  saveStaff(staff);

  return employee;
}

export function updateStaff(id, changes) {
  const staff = getStaff();

  const index = staff.findIndex(
    person => person.id.toUpperCase() === id.toUpperCase()
  );

  if (index === -1) {
    throw new Error("Employee not found.");
  }

  staff[index] = {
    ...staff[index],
    ...changes
  };

  saveStaff(staff);

  return staff[index];
}

export function deleteStaff(id) {
  const staff = getStaff();

  saveStaff(
    staff.filter(
      person => person.id.toUpperCase() !== id.toUpperCase()
    )
  );
}

export function onStorageChange(callback) {
  window.addEventListener("storage", event => {
    if (
      event.key === STAFF_KEY ||
      event.key === LOGS_KEY ||
      event.key === SETTINGS_KEY
    ) {
      callback(event);
    }
  });
}