import {
  getStaff,
  addStaff,
  deleteStaff,
  onStorageChange
} from "./storage.js";

import {
  formatDate,
  escapeHTML
} from "./utils.js";

import {
  changePin
} from "./auth.js";

import {
  exportJSON,
  exportCSV,
  importJSON
} from "./backup.js";

const form =
  document.querySelector("#staff-form");

const tableBody =
  document.querySelector("#staff-table-body");

const empty =
  document.querySelector("#staff-empty");

const pinForm =
  document.querySelector("#pin-form");

const backupMessage =
  document.querySelector("#backup-message");

function renderRoster() {
  const staff = getStaff();

  tableBody.innerHTML = "";

  if (!staff.length) {
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  staff
    .sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    .forEach(employee => {

      const row =
        document.createElement("tr");

      row.innerHTML = `
        <td>
          <strong>
            ${escapeHTML(employee.id)}
          </strong>
        </td>

        <td>
          ${escapeHTML(employee.name)}
        </td>

        <td>
          ${escapeHTML(
            employee.department || "—"
          )}
        </td>

        <td>
          <span class="status status-working">
            Active
          </span>
        </td>

        <td>
          ${formatDate(employee.createdAt)}
        </td>

        <td>
          <button
            class="button button-danger"
            data-delete-id="${escapeHTML(employee.id)}"
            type="button"
          >
            Delete
          </button>
        </td>
      `;

      tableBody.appendChild(row);
    });
}

function setMessage(message, error = false) {
  backupMessage.textContent = message;

  backupMessage.style.color =
    error
      ? "#ff8b8b"
      : "#72e6a8";
}

function handleStaffSubmit(event) {
  event.preventDefault();

  const id =
    document.querySelector(
      "#staff-id"
    ).value.trim().toUpperCase();

  const name =
    document.querySelector(
      "#staff-name"
    ).value.trim();

  const department =
    document.querySelector(
      "#staff-department"
    ).value.trim();

  if (!id || !name) {
    return;
  }

  try {
    addStaff({
      id,
      name,
      department,
      active: true,
      createdAt: Date.now()
    });

    form.reset();

    renderRoster();

  } catch (error) {
    alert(error.message);
  }
}

function handleDelete(event) {
  const button =
    event.target.closest(
      "[data-delete-id]"
    );

  if (!button) {
    return;
  }

  const id =
    button.dataset.deleteId;

  const confirmed =
    window.confirm(
      `Delete employee ${id}?`
    );

  if (!confirmed) {
    return;
  }

  deleteStaff(id);

  renderRoster();
}

async function handlePinChange(event) {
  event.preventDefault();

  const current =
    document.querySelector(
      "#current-pin"
    ).value;

  const next =
    document.querySelector(
      "#new-pin"
    ).value;

  const confirm =
    document.querySelector(
      "#confirm-pin"
    ).value;

  if (next !== confirm) {
    alert("New PINs do not match.");
    return;
  }

  try {
    await changePin(
      current,
      next
    );

    pinForm.reset();

    alert("Admin PIN changed successfully.");

  } catch (error) {
    alert(error.message);
  }
}

async function handleImport(event) {
  const file =
    event.target.files[0];

  if (!file) {
    return;
  }

  try {
    await importJSON(file);

    setMessage(
      "Backup restored successfully."
    );

    renderRoster();

  } catch (error) {
    setMessage(
      error.message,
      true
    );
  }

  event.target.value = "";
}

export function initRoster() {
  form?.addEventListener(
    "submit",
    handleStaffSubmit
  );

  tableBody?.addEventListener(
    "click",
    handleDelete
  );

  pinForm?.addEventListener(
    "submit",
    handlePinChange
  );

  document.querySelector(
    "#export-json"
  )?.addEventListener(
    "click",
    exportJSON
  );

  document.querySelector(
    "#export-csv"
  )?.addEventListener(
    "click",
    exportCSV
  );

  document.querySelector(
    "#import-json"
  )?.addEventListener(
    "change",
    handleImport
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
    renderRoster();
  });

  renderRoster();
}