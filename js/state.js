import {
  getLogs,
  saveLogs
} from "./storage.js";

import {
  generateId,
  normalizeEmployeeId
} from "./utils.js";

export const STATES = {
  OFF_DUTY: "OFF_DUTY",
  WORKING: "WORKING",
  ON_BREAK: "ON_BREAK",
  AUTO_EXPIRED: "AUTO_EXPIRED"
};

export const ACTIONS = {
  CLOCK_IN: "CLOCK_IN",
  START_BREAK: "START_BREAK",
  END_BREAK: "END_BREAK",
  CLOCK_OUT: "CLOCK_OUT"
};

const MAX_SHIFT_MS = 16 * 60 * 60 * 1000;

export function calculateBreakMs(log, now = Date.now()) {
  if (!log?.breaks?.length) {
    return 0;
  }

  return log.breaks.reduce((total, item) => {
    if (!item.start) return total;

    const end = item.end ?? log.clockOut ?? now;

    return total + Math.max(0, end - item.start);
  }, 0);
}

export function calculateWorkMs(log, now = Date.now()) {
  if (!log?.clockIn) {
    return 0;
  }

  const end = log.clockOut ?? now;

  return Math.max(
    0,
    end - log.clockIn - calculateBreakMs(log, now)
  );
}

export function findActiveLog(employeeId) {
  const id = normalizeEmployeeId(employeeId);

  return (
    getLogs()
      .filter(log =>
        normalizeEmployeeId(log.employeeId) === id &&
        (
          log.status === STATES.WORKING ||
          log.status === STATES.ON_BREAK
        )
      )
      .sort((a, b) => b.clockIn - a.clockIn)[0] || null
  );
}

export function resolveExpiredShift(employeeId) {
  const active = findActiveLog(employeeId);

  if (!active) {
    return null;
  }

  const now = Date.now();

  if (now - active.clockIn <= MAX_SHIFT_MS) {
    return active;
  }

  const logs = getLogs();

  const index = logs.findIndex(
    log => log.id === active.id
  );

  if (index === -1) {
    return null;
  }

  const expiryTime = active.clockIn + MAX_SHIFT_MS;

  const updated = {
    ...logs[index],
    clockOut: expiryTime,
    status: STATES.AUTO_EXPIRED,
    autoExpired: true
  };

  if (updated.breaks?.length) {
    const last =
      updated.breaks[updated.breaks.length - 1];

    if (last.start && !last.end) {
      last.end = expiryTime;
    }
  }

  updated.totalBreakMs =
    calculateBreakMs(updated);

  updated.totalWorkMs =
    calculateWorkMs(updated);

  logs[index] = updated;

  saveLogs(logs);

  return null;
}

export function getEmployeeState(employeeId) {
  resolveExpiredShift(employeeId);

  const active = findActiveLog(employeeId);

  return active?.status ?? STATES.OFF_DUTY;
}

export function clockIn(employeeId) {
  const id = normalizeEmployeeId(employeeId);

  resolveExpiredShift(id);

  if (findActiveLog(id)) {
    throw new Error("Employee is already clocked in.");
  }

  const log = {
    id: generateId("log"),
    employeeId: id,

    clockIn: Date.now(),
    clockOut: null,

    status: STATES.WORKING,

    breaks: [],

    totalBreakMs: 0,
    totalWorkMs: null,

    autoExpired: false
  };

  const logs = getLogs();

  logs.push(log);

  saveLogs(logs);

  return log;
}

export function startBreak(employeeId) {
  const active = findActiveLog(employeeId);

  if (!active || active.status !== STATES.WORKING) {
    throw new Error("Employee is not currently working.");
  }

  const logs = getLogs();

  const index = logs.findIndex(
    log => log.id === active.id
  );

  logs[index] = {
    ...logs[index],

    status: STATES.ON_BREAK,

    breaks: [
      ...(logs[index].breaks || []),
      {
        start: Date.now(),
        end: null
      }
    ]
  };

  saveLogs(logs);

  return logs[index];
}

export function endBreak(employeeId) {
  const active = findActiveLog(employeeId);

  if (!active || active.status !== STATES.ON_BREAK) {
    throw new Error("Employee is not on break.");
  }

  const logs = getLogs();

  const index = logs.findIndex(
    log => log.id === active.id
  );

  const breaks = [...(logs[index].breaks || [])];

  const current = breaks[breaks.length - 1];

  if (!current || current.end) {
    throw new Error("No active break exists.");
  }

  current.end = Date.now();

  logs[index] = {
    ...logs[index],
    status: STATES.WORKING,
    breaks,
    totalBreakMs: calculateBreakMs({
      ...logs[index],
      breaks
    })
  };

  saveLogs(logs);

  return logs[index];
}

export function clockOut(employeeId) {
  const active = findActiveLog(employeeId);

  if (!active) {
    throw new Error("Employee is not currently clocked in.");
  }

  const logs = getLogs();

  const index = logs.findIndex(
    log => log.id === active.id
  );

  const updated = {
    ...logs[index],
    clockOut: Date.now(),
    status: STATES.OFF_DUTY
  };

  if (updated.breaks?.length) {
    const last =
      updated.breaks[updated.breaks.length - 1];

    if (last.start && !last.end) {
      last.end = updated.clockOut;
    }
  }

  updated.totalBreakMs =
    calculateBreakMs(updated);

  updated.totalWorkMs =
    calculateWorkMs(updated);

  logs[index] = updated;

  saveLogs(logs);

  return updated;
}

export function performAction(employeeId, action) {
  switch (action) {
    case ACTIONS.CLOCK_IN:
      return clockIn(employeeId);

    case ACTIONS.START_BREAK:
      return startBreak(employeeId);

    case ACTIONS.END_BREAK:
      return endBreak(employeeId);

    case ACTIONS.CLOCK_OUT:
      return clockOut(employeeId);

    default:
      throw new Error("Invalid attendance action.");
  }
}

export function getAvailableActions(employeeId) {
  switch (getEmployeeState(employeeId)) {
    case STATES.OFF_DUTY:
      return [ACTIONS.CLOCK_IN];

    case STATES.WORKING:
      return [
        ACTIONS.START_BREAK,
        ACTIONS.CLOCK_OUT
      ];

    case STATES.ON_BREAK:
      return [ACTIONS.END_BREAK];

    default:
      return [];
  }
}