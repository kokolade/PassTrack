import {
  getStaff,
  getLogs,
  onStorageChange
} from "./storage.js";

import {
  STATES,
  calculateBreakMs,
  calculateWorkMs
} from "./state.js";

import {
  formatDateTime,
  formatDuration,
  escapeHTML,
  todayStart
} from "./utils.js";

const tableBody =
  document.querySelector("#logs-table-body");

const empty =
  document.querySelector("#logs-empty");

const search =
  document.querySelector("#log-search");

const filter =
  document.querySelector("#log-filter");

function getEmployee(id) {
  return getStaff().find(
    employee =>
      employee.id.toUpperCase() ===
      id.toUpperCase()
  );
}

function statusLabel(status) {
  switch (status) {
    case STATES.WORKING:
      return "Working";

    case STATES.ON_BREAK:
      return "On Break";

    case STATES.AUTO_EXPIRED:
      return "Auto Expired";

    case STATES.OFF_DUTY:
      return "Completed";

    default:
      return status;
  }
}

function statusClass(status) {
  switch (status) {
    case STATES.WORKING:
      return "status-working";

    case STATES.ON_BREAK:
      return "status-break";

    case STATES.AUTO_EXPIRED:
      return "status-expired";

    default:
      return "status-completed";
  }
}

function renderMetrics() {
  const staff = getStaff();
  const logs = getLogs();

  const working =
    logs.filter(
      log => log.status === STATES.WORKING
    ).length;

  const onBreak =
    logs.filter(
      log => log.status === STATES.ON_BREAK
    ).length;

  const start = todayStart();

  const todayHours = logs
    .filter(log =>
      log.clockIn >= start &&
      log.clockOut
    )
    .reduce(
      (total, log) =>
        total + calculateWorkMs(log),
      0
    );

  document.querySelector(
    "#metric-employees"
  ).textContent =
    staff.filter(e => e.active !== false).length;

  document.querySelector(
    "#metric-working"
  ).textContent = working;

  document.querySelector(
    "#metric-break"
  ).textContent = onBreak;

  document.querySelector(
    "#metric-hours"
  ).textContent =
    formatDuration(todayHours)
      .replace(" 00m", "");
}

function renderTable() {
  const query =
    search?.value.trim().toLowerCase() || "";

  const selectedFilter =
    filter?.value || "ALL";

  const staff = getStaff();

  let logs = getLogs()
    .sort(
      (a, b) =>
        (b.clockIn || 0) -
        (a.clockIn || 0)
    );

  logs = logs.filter(log => {
    const employee = getEmployee(log.employeeId);

    const matchesSearch =
      !query ||
      log.employeeId.toLowerCase().includes(query) ||
      employee?.name.toLowerCase().includes(query);

    const matchesFilter =
      selectedFilter === "ALL" ||
      log.status === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  tableBody.innerHTML = "";

  if (!logs.length) {
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  logs.forEach(log => {
    const employee =
      getEmployee(log.employeeId);

    const name =
      employee?.name || "Unknown Employee";

    const breakMs =
      calculateBreakMs(log);

    const workMs =
      calculateWorkMs(log);

    const row =
      document.createElement("tr");

    row.innerHTML = `
      <td>
        <strong>${escapeHTML(name)}</strong>
        <br>
        <small class="muted">
          ${escapeHTML(log.employeeId)}
        </small>
      </td>

      <td>
        ${formatDateTime(log.clockIn)}
      </td>

      <td>
        ${formatDateTime(log.clockOut)}
      </td>

      <td>
        <span class="status ${statusClass(log.status)}">
          ${statusLabel(log.status)}
        </span>
      </td>

      <td>
        ${formatDuration(breakMs)}
      </td>

      <td>
        ${formatDuration(workMs)}
      </td>
    `;

    tableBody.appendChild(row);
  });
}

export function renderLogs() {
  renderMetrics();
  renderTable();
}

export function initLogs() {
  search?.addEventListener(
    "input",
    renderTable
  );

  filter?.addEventListener(
    "change",
    renderTable
  );

  document.querySelector(
    "#lock-admin"
  )?.addEventListener(
    "click",
    async () => {
      const { lockAdmin } =
        await import("./auth.js");

      lockAdmin();
    }
  );

  onStorageChange(() => {
    renderLogs();
  });

  renderLogs();
}