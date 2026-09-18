export function generateId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

export function normalizeEmployeeId(id) {
  return String(id || "")
    .trim()
    .toUpperCase();
}

export function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatDate(timestamp) {
  if (!timestamp) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(timestamp));
}

export function formatDateTime(timestamp) {
  if (!timestamp) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).format(new Date(timestamp));
}

export function formatTime(timestamp) {
  if (!timestamp) return "--:--:--";

  return new Intl.DateTimeFormat("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).format(new Date(timestamp));
}

export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "0h 00m";
  }

  const minutes = Math.floor(ms / 60000);

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return `${hours}h ${String(remaining).padStart(2, "0")}m`;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export function todayStart() {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date.getTime();
}