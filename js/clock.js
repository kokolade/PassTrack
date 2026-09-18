import {
  formatTime
} from "./utils.js";

function updateClock() {
  const now = Date.now();

  const clock = document.querySelector("#live-clock");
  const date = document.querySelector("#live-date");

  if (clock) {
    clock.textContent = formatTime(now);
  }

  if (date) {
    date.textContent = new Intl.DateTimeFormat("en-NG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(now));
  }
}

export function startClock() {
  updateClock();

  setInterval(updateClock, 1000);
}