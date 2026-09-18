import {
  initializeAdminPin,
  isAdminAuthenticated,
  authenticate,
  startAdminIdleLock
} from "./auth.js";

import {
  startClock
} from "./clock.js";

import {
  initKiosk
} from "./kiosk.js";

import {
  initLogs
} from "./logs.js";

import {
  initRoster
} from "./roster.js";

async function showAdminLogin() {
  const existing =
    document.querySelector(
      "#admin-login-modal"
    );

  if (existing) {
    return;
  }

  const modal =
    document.createElement("div");

  modal.id =
    "admin-login-modal";

  modal.innerHTML = `
    <div style="
      position:fixed;
      inset:0;
      z-index:999;
      display:grid;
      place-items:center;
      padding:20px;
      background:rgba(0,0,0,.72);
      backdrop-filter:blur(8px);
    ">

      <form id="admin-login-form" style="
        width:min(400px,100%);
        padding:30px;
        border-radius:18px;
        border:1px solid #263752;
        background:#101d31;
        box-shadow:0 25px 70px rgba(0,0,0,.45);
      ">

        <p style="
          margin:0;
          color:#4f8cff;
          font-size:11px;
          font-weight:900;
          letter-spacing:1.5px;
        ">
          PASSTRACK ADMIN
        </p>

        <h2 style="margin:8px 0;">
          Management Access
        </h2>

        <p style="
          color:#91a0b7;
          font-size:13px;
          margin-bottom:20px;
        ">
          Enter the administrator PIN.
        </p>

        <input
          id="admin-pin"
          type="password"
          inputmode="numeric"
          autocomplete="current-password"
          maxlength="20"
          placeholder="PIN"
          required
          style="
            width:100%;
            padding:14px;
            border-radius:10px;
            border:1px solid #263752;
            background:#081221;
            color:white;
            outline:none;
          "
        >

        <p
          id="admin-login-error"
          style="
            color:#ff8b8b;
            font-size:12px;
            min-height:18px;
          "
        ></p>

        <button
          type="submit"
          style="
            width:100%;
            padding:13px;
            border:0;
            border-radius:10px;
            background:#4f8cff;
            color:white;
            font-weight:800;
            cursor:pointer;
          "
        >
          Unlock
        </button>

        <button
          id="cancel-admin-login"
          type="button"
          style="
            width:100%;
            margin-top:8px;
            padding:11px;
            border:1px solid #263752;
            border-radius:10px;
            background:#14243b;
            color:white;
            font-weight:700;
            cursor:pointer;
          "
        >
          Cancel
        </button>

      </form>

    </div>
  `;

  document.body.appendChild(modal);

  const form =
    modal.querySelector(
      "#admin-login-form"
    );

  const pin =
    modal.querySelector(
      "#admin-pin"
    );

  const error =
    modal.querySelector(
      "#admin-login-error"
    );

  pin.focus();

  form.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      const valid =
        await authenticate(pin.value);

      if (!valid) {
        error.textContent =
          "Incorrect administrator PIN.";

        pin.select();

        return;
      }

      modal.remove();

      window.location.href =
        "./logs.html";
    }
  );

  modal.querySelector(
    "#cancel-admin-login"
  ).addEventListener(
    "click",
    () => modal.remove()
  );
}

function setupNavigation() {
  const page =
    document.body.dataset.page;

  document
    .querySelectorAll("[data-nav]")
    .forEach(link => {

      if (
        link.dataset.nav === page
      ) {
        link.classList.add("active");
      }
    });

  document
    .querySelectorAll(
      'a[href="./logs.html"], a[href="./roster.html"]'
    )
    .forEach(link => {

      link.addEventListener(
        "click",
        async event => {

          if (
            isAdminAuthenticated()
          ) {
            return;
          }

          event.preventDefault();

          await showAdminLogin();
        }
      );
    });
}

async function boot() {
  await initializeAdminPin();

  setupNavigation();

  const page =
    document.body.dataset.page;

  if (page === "kiosk") {
    startClock();
    initKiosk();
    return;
  }

  if (
    page === "logs" ||
    page === "roster"
  ) {
    if (!isAdminAuthenticated()) {
      window.location.replace(
        "./index.html"
      );

      return;
    }

    startAdminIdleLock();
  }

  if (page === "logs") {
    initLogs();
  }

  if (page === "roster") {
    initRoster();
  }
}

boot().catch(error => {
  console.error(
    "PassTrack failed to start:",
    error
  );
});