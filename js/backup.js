import {
  getStaff,
  getLogs,
  saveStaff,
  saveLogs
} from "./storage.js";

import {
  downloadBlob
} from "./utils.js";

function timestampName() {
  return new Date()
    .toISOString()
    .replaceAll(":", "-")
    .replaceAll(".", "-");
}

export function exportJSON() {
  const backup = {
    format: "PassTrack Backup",
    version: 1,
    exportedAt: Date.now(),

    staff: getStaff(),
    logs: getLogs()
  };

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    {
      type: "application/json"
    }
  );

  downloadBlob(
    blob,
    `passtrack-backup-${timestampName()}.json`
  );
}

function csvEscape(value) {
  const string =
    String(value ?? "");

  return `"${string.replaceAll('"', '""')}"`;
}

export function exportCSV() {
  const staff = getStaff();
  const logs = getLogs();

  const header = [
    "employeeId",
    "employeeName",
    "department",
    "clockIn",
    "clockOut",
    "status",
    "totalBreakMs",
    "totalWorkMs",
    "autoExpired"
  ];

  const rows = logs.map(log => {
    const employee =
      staff.find(
        person =>
          person.id.toUpperCase() ===
          log.employeeId.toUpperCase()
      );

    return [
      log.employeeId,
      employee?.name || "",
      employee?.department || "",
      log.clockIn,
      log.clockOut || "",
      log.status,
      log.totalBreakMs || 0,
      log.totalWorkMs || "",
      log.autoExpired ? "true" : "false"
    ];
  });

  const csv = [
    header,
    ...rows
  ]
    .map(row =>
      row.map(csvEscape).join(",")
    )
    .join("\n");

  const blob = new Blob(
    [csv],
    {
      type: "text/csv;charset=utf-8"
    }
  );

  downloadBlob(
    blob,
    `passtrack-attendance-${timestampName()}.csv`
  );
}

export function importJSON(file) {
  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload = () => {
        try {
          const data =
            JSON.parse(reader.result);

          if (
            data?.format !==
            "PassTrack Backup"
          ) {
            throw new Error(
              "This is not a valid PassTrack backup."
            );
          }

          if (!Array.isArray(data.staff)) {
            throw new Error(
              "Backup staff data is invalid."
            );
          }

          if (!Array.isArray(data.logs)) {
            throw new Error(
              "Backup log data is invalid."
            );
          }

          saveStaff(data.staff);
          saveLogs(data.logs);

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(
          new Error("Could not read backup file.")
        );
      };

      reader.readAsText(file);
    }
  );
}