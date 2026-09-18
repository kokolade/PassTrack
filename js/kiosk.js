import {
  getStaff,
  onStorageChange
} from "./storage.js";

import {
  ACTIONS,
  STATES,
  getEmployeeState,
  performAction,
  getAvailableActions
} from "./state.js";

import {
  normalizeEmployeeId,
  escapeHTML
} from "./utils.js";

import {
  successSound,
  errorSound
} from "./audio.js";

let input = "";
let idleTimer = null;

const IDLE_TIME = 30000;

const inputElement =
  document.querySelector("#employee-input");

const messageElement =
  document.querySelector("#terminal-message");

const previewElement =
  document.querySelector("#employee-preview");

const actionsElement =
  document.querySelector("#context-actions");

function setMessage(
  message,
  type = "normal"
) {
  if (!messageElement) return;

  const dot =
    messageElement.querySelector(".status-dot");

  messageElement.lastChild.textContent =
    ` ${message}`;

  dot.className = "status-dot";

  if (type === "error") {
    dot.classList.add("error");
  }

  if (type === "warning") {
    dot.classList.add("warning");
  }
}

function resetInput() {
  input = "";

  clearTimeout(idleTimer);

  renderInput();

  previewElement.classList.add("hidden");
  actionsElement.classList.add("hidden");

  setMessage("Ready for employee ID");
}

function restartIdleTimer() {
  clearTimeout(idleTimer);

  idleTimer = setTimeout(() => {
    resetInput();
  }, IDLE_TIME);
}

function renderInput() {
  inputElement.textContent =
    input || "_";
}

function findEmployee() {
  const id = normalizeEmployeeId(input);

  return getStaff().find(
    employee =>
      normalizeEmployeeId(employee.id) === id &&
      employee.active !== false
  );
}

function showEmployee(employee) {
  previewElement.innerHTML = `
    <strong>${escapeHTML(employee.name)}</strong>
    <span>
      ${escapeHTML(employee.department || "Staff")}
      · ${escapeHTML(employee.id)}
    </span>
  `;

  previewElement.classList.remove("hidden");
}

function actionLabel(action) {
  switch (action) {
    case ACTIONS.CLOCK_IN:
      return "Clock In";

    case ACTIONS.START_BREAK:
      return "Start Break";

    case ACTIONS.END_BREAK:
      return "End Break";

    case ACTIONS.CLOCK_OUT:
      return "Clock Out";

    default:
      return action;
  }
}

function renderActions(employee) {
  const actions =
    getAvailableActions(employee.id);

  actionsElement.innerHTML = "";

  actions.forEach((action, index) => {
    const button =
      document.createElement("button");

    button.type = "button";
    button.className =
      `context-action ${index === 0 ? "primary" : ""}`;

    button.textContent =
      actionLabel(action);

    button.addEventListener("click", () => {
      handleAction(employee.id, action);
    });

    actionsElement.appendChild(button);
  });

  actionsElement.classList.remove("hidden");
}

function submit() {
  const employee = findEmployee();

  if (!employee) {
    errorSound();

    setMessage(
      input
        ? "Employee ID not found."
        : "Enter an employee ID first.",
      "error"
    );

    return;
  }

  const state =
    getEmployeeState(employee.id);

  showEmployee(employee);

  if (state === STATES.WORKING) {
    setMessage(
      "Employee is currently working.",
      "normal"
    );
  } else if (state === STATES.ON_BREAK) {
    setMessage(
      "Employee is currently on break.",
      "warning"
    );
  } else {
    setMessage(
      "Employee is off duty.",
      "normal"
    );
  }

  renderActions(employee);
}

function handleAction(
  employeeId,
  action
) {
  try {
    performAction(employeeId, action);

    successSound();

    const employee =
      getStaff().find(
        person =>
          normalizeEmployeeId(person.id) ===
          normalizeEmployeeId(employeeId)
      );

    if (employee) {
      showEmployee(employee);

      const state =
        getEmployeeState(employeeId);

      if (state === STATES.WORKING) {
        setMessage(
          "Attendance updated — currently working."
        );
      } else if (state === STATES.ON_BREAK) {
        setMessage(
          "Attendance updated — on break.",
          "warning"
        );
      } else {
        setMessage(
          "Attendance recorded successfully."
        );
      }

      renderActions(employee);
    }

    input = "";
    renderInput();
    restartIdleTimer();

  } catch (error) {
    console.error(error);

    errorSound();

    setMessage(
      error.message || "Unable to process action.",
      "error"
    );
  }
}

function handleKey(key) {
  restartIdleTimer();

  if (input.length >= 20) {
    return;
  }

  input += key;

  renderInput();

  setMessage("Employee ID entered.");
}

function bindKeypad() {
  document.querySelectorAll("[data-key]")
    .forEach(button => {
      button.addEventListener("click", () => {
        handleKey(button.dataset.key);
      });
    });

  document.querySelector(
    '[data-action="clear"]'
  )?.addEventListener("click", () => {
    resetInput();
  });

  document.querySelector(
    '[data-action="submit"]'
  )?.addEventListener("click", () => {
    submit();
  });
}

function bindKeyboard() {
  window.addEventListener("keydown", event => {

    if (/^\d$/.test(event.key)) {
      handleKey(event.key);
    }

    if (event.key === "Backspace") {
      input = input.slice(0, -1);
      renderInput();
      restartIdleTimer();
    }

    if (event.key === "Escape") {
      resetInput();
    }

    if (event.key === "Enter") {
      submit();
    }
  });
}

export function initKiosk() {
  bindKeypad();
  bindKeyboard();
  renderInput();
  onStorageChange(() => { resetInput(); })
  document.querySelector("#admin-access")?.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("passtrack:admin-login"));
   });
}