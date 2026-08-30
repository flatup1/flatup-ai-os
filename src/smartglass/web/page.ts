/**
 * ブラウザに出す画面。1枚のHTMLとして返す（ビルド不要・依存ゼロ）。
 *
 * 文言は i18n.ts、色と大きさは ui/tokens.ts から取る。
 * ＝スマホ版とWeb版で「誰でも使える」決まりが1つに保たれる（テストで見張っている）。
 */

import { T } from "../i18n.js";
import { BASE_FONT_SIZES, COLORS, FONT_SCALES, MIN_TAP_TARGET_DP, PRIMARY_BUTTON_HEIGHT_DP } from "../ui/tokens.js";
import type { FontScaleName } from "../types.js";

const SCALE_LABELS: [FontScaleName, string][] = [
  ["small", T.settings.fontSmall],
  ["medium", T.settings.fontMedium],
  ["large", T.settings.fontLarge],
  ["xlarge", T.settings.fontXLarge],
];

export function renderPage(): string {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="${COLORS.primary}">
<title>${T.app.name}</title>
<style>
:root {
  --scale: ${FONT_SCALES.large};
  --title: calc(${BASE_FONT_SIZES.title}px * var(--scale));
  --body: calc(${BASE_FONT_SIZES.body}px * var(--scale));
  --caption: calc(${BASE_FONT_SIZES.caption}px * var(--scale));
  --button: calc(${BASE_FONT_SIZES.button}px * var(--scale));
  --status: calc(${BASE_FONT_SIZES.status}px * var(--scale));
  --tap: max(${MIN_TAP_TARGET_DP}px, calc(${PRIMARY_BUTTON_HEIGHT_DP}px * var(--scale)));
  --bg: ${COLORS.background};
  --surface: ${COLORS.surface};
  --text: ${COLORS.text};
  --muted: ${COLORS.textMuted};
  --ok: ${COLORS.ok};
  --warn: ${COLORS.warn};
  --error: ${COLORS.error};
  --primary: ${COLORS.primary};
  --on-primary: ${COLORS.onPrimary};
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
body {
  margin: 0; background: var(--bg); color: var(--text);
  font-family: -apple-system, "Hiragino Sans", "Yu Gothic", sans-serif;
  font-size: var(--body); line-height: 1.7;
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
  max-width: 1100px; margin-inline: auto;
}
h1 { font-size: var(--title); margin: 0 0 12px; }
h2 { font-size: var(--title); margin: 32px 0 8px; }
#status {
  border: 3px solid var(--muted); border-radius: 16px; padding: 16px; margin-bottom: 12px;
}
#status.ok { border-color: var(--ok); } #status.ok #statusText { color: var(--ok); }
#status.warn { border-color: var(--warn); } #status.warn #statusText { color: var(--warn); }
#status.error { border-color: var(--error); } #status.error #statusText { color: var(--error); }
#statusText { font-size: var(--status); font-weight: 800; color: var(--muted); margin: 0; }
#statusHint { color: var(--muted); margin: 8px 0 0; }
button {
  font: inherit; font-size: var(--button); font-weight: 700; cursor: pointer;
  min-height: var(--tap); width: 100%; border: 0; border-radius: 16px;
  background: var(--primary); color: var(--on-primary); padding: 0 20px; margin: 8px 0;
}
button.plain { background: var(--surface); color: var(--text); }
button:disabled { opacity: .5; cursor: default; }
button:active { filter: brightness(.92); }
.row { display: flex; gap: 8px; }
.row button { margin: 8px 0; }
#bar { height: 16px; border-radius: 8px; background: var(--surface); overflow: hidden; margin-top: 12px; }
#barFill { height: 100%; width: 0; background: var(--primary); transition: width .2s; }
#progressText { font-weight: 700; margin: 8px 0 0; }
#error { border: 2px solid var(--error); border-radius: 16px; padding: 16px; margin: 12px 0; display: none; }
#errorWhat { color: var(--error); font-weight: 700; margin: 0 0 8px; }
#errorNext { margin: 0; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.cell {
  position: relative; aspect-ratio: 1; border: 0; padding: 0; margin: 0; overflow: hidden;
  border-radius: 12px; background: var(--surface); display: block; width: 100%; cursor: pointer;
}
.cell img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cell .cap {
  position: absolute; inset: auto 0 0 0; background: rgba(255,255,255,.88);
  font-size: var(--caption); color: var(--muted); padding: 6px 8px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left;
}
.cell .kind {
  position: absolute; inset: 8px auto auto 8px; background: var(--primary); color: var(--on-primary);
  font-size: var(--caption); font-weight: 700; border-radius: 8px; padding: 2px 8px;
}
.day { color: var(--muted); font-weight: 700; margin: 20px 0 8px; }
#empty { color: var(--muted); }
dialog {
  border: 0; border-radius: 16px; padding: 16px; max-width: 96vw; width: 900px;
  background: var(--bg); color: var(--text);
}
dialog::backdrop { background: rgba(0,0,0,.7); }
dialog img, dialog video { width: 100%; max-height: 62vh; object-fit: contain; border-radius: 12px; background: #000; }
dialog p { margin: 12px 0 0; color: var(--muted); }
.sizes { display: flex; gap: 8px; }
.sizes button { margin: 8px 0; }
.sizes button[aria-pressed="true"] { outline: 4px solid var(--primary); outline-offset: -4px; }
.hint { color: var(--muted); font-size: var(--caption); margin: 0 0 8px; }
</style>
</head>
<body>

<h1>${T.app.name}</h1>

<section id="status" aria-live="polite">
  <p id="statusText">${T.common.loading}</p>
  <p id="statusHint"></p>
  <div id="progress" hidden>
    <div id="bar"><div id="barFill"></div></div>
    <p id="progressText"></p>
  </div>
</section>

<button id="importBtn">${T.transfer.start}</button>

<div id="error" role="alert">
  <p id="errorWhat"></p>
  <p id="errorNext"></p>
</div>

<h2>${T.gallery.title}</h2>
<p id="empty" hidden>${T.gallery.empty}</p>
<div id="gallery"></div>

<h2>${T.settings.title}</h2>
<p class="hint">${T.settings.fontSize}</p>
<div class="sizes">
  ${SCALE_LABELS.map(([name, label]) => `<button class="plain" data-scale="${name}">${label}</button>`).join("\n  ")}
</div>
<p class="hint" id="openHint"></p>

<dialog id="viewer">
  <div id="viewerBody"></div>
  <p id="viewerMeta"></p>
  <button id="saveBtn">${T.gallery.saveToPhone}</button>
  <button class="plain" id="shareBtn">${T.gallery.share}</button>
  <button class="plain" id="closeBtn">${T.common.close}</button>
</dialog>

<script>
const TXT = ${JSON.stringify({
    connected: T.connection.connected,
    disconnected: T.connection.disconnected,
    transferring: T.connection.transferring,
    none: T.transfer.none,
    start: T.transfer.start,
    retry: T.transfer.retryFailed,
    done: T.transfer.done,
    saved: T.gallery.saved,
    photo: T.gallery.photo,
    video: T.gallery.video,
    audio: T.gallery.audio,
    hintPowerOn: T.connection.hintPowerOn,
  })};
const SCALES = ${JSON.stringify(FONT_SCALES)};

const $ = (id) => document.getElementById(id);
let state = null;
let current = null;

function setScale(name) {
  document.documentElement.style.setProperty("--scale", SCALES[name]);
  for (const b of document.querySelectorAll("[data-scale]")) {
    b.setAttribute("aria-pressed", String(b.dataset.scale === name));
  }
  try { localStorage.setItem("fontScale", name); } catch {}
  fetch("/api/settings", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ fontScale: name }),
  }).catch(() => {});
}
for (const b of document.querySelectorAll("[data-scale]")) {
  b.addEventListener("click", () => setScale(b.dataset.scale));
}

function render(next) {
  state = next;
  const busy = next.busy;
  $("status").className = busy ? "ok" : next.mediaCount > 0 ? "ok" : "";
  $("statusText").textContent = busy ? TXT.transferring : TXT.connected;
  $("statusHint").textContent = busy ? "" : next.hint || "";

  $("progress").hidden = !busy || !next.progress || next.progress.total === 0;
  if (next.progress) {
    $("barFill").style.width = Math.round(next.progress.ratio * 100) + "%";
    $("progressText").textContent = next.progress.message;
  }

  const btn = $("importBtn");
  btn.disabled = busy;
  btn.textContent = next.pendingCount > 0 ? TXT.retry : TXT.start;

  if (next.error) {
    $("error").style.display = "block";
    $("errorWhat").textContent = next.error.what;
    $("errorNext").textContent = next.error.next;
  } else {
    $("error").style.display = "none";
  }

  $("empty").hidden = next.sections.length > 0;
  $("gallery").innerHTML = next.sections.map(sectionHtml).join("");
  for (const cell of document.querySelectorAll(".cell")) {
    cell.addEventListener("click", () => open(cell.dataset.id));
  }
}

function sectionHtml(section) {
  return '<p class="day">' + esc(section.title) + '</p><div class="grid">' +
    section.items.map(cellHtml).join("") + "</div>";
}

function cellHtml(item) {
  const label = item.kind === "video" ? TXT.video : item.kind === "audio" ? TXT.audio : TXT.photo;
  const thumb = item.kind === "photo"
    ? '<img loading="lazy" alt="' + esc(item.fileName) + '" src="/media/' + encodeURIComponent(item.id) + '">'
    : "";
  return '<button class="cell" data-id="' + esc(item.id) + '">' + thumb +
    '<span class="kind">' + label + "</span>" +
    '<span class="cap">' + esc(item.fileName) + "</span></button>";
}

function open(id) {
  current = findItem(id);
  if (!current) return;
  const url = "/media/" + encodeURIComponent(current.id);
  $("viewerBody").innerHTML = current.kind === "video"
    ? '<video controls playsinline src="' + url + '"></video>'
    : current.kind === "audio"
      ? '<audio controls style="width:100%" src="' + url + '"></audio>'
      : '<img alt="' + esc(current.fileName) + '" src="' + url + '">';
  $("viewerMeta").textContent = current.fileName + " ・ " + current.size;
  $("viewer").showModal();
}

function findItem(id) {
  for (const s of state.sections) for (const i of s.items) if (i.id === id) return i;
  return null;
}

$("closeBtn").addEventListener("click", () => $("viewer").close());
$("saveBtn").addEventListener("click", () => {
  if (!current) return;
  // ブラウザの「ダウンロード」に落とす。iPhone は長押しで写真アプリにも入る。
  const a = document.createElement("a");
  a.href = "/media/" + encodeURIComponent(current.id) + "?download=1";
  a.download = current.fileName;
  document.body.appendChild(a); a.click(); a.remove();
});
$("shareBtn").addEventListener("click", async () => {
  if (!current) return;
  const url = location.origin + "/media/" + encodeURIComponent(current.id);
  try {
    if (navigator.share) {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], current.fileName, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
      await navigator.share({ url });
      return;
    }
    await navigator.clipboard.writeText(url);
  } catch {}
});

$("importBtn").addEventListener("click", async () => {
  $("importBtn").disabled = true;
  await fetch("/api/import", { method: "POST" }).catch(() => {});
});

function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// 変化があったら、サーバから押してもらう（こちらから何度も聞きに行かない）。
const events = new EventSource("/events");
events.onmessage = (e) => render(JSON.parse(e.data));

fetch("/api/state").then((r) => r.json()).then((s) => {
  let saved = null;
  try { saved = localStorage.getItem("fontScale"); } catch {}
  setScale(saved || s.fontScale || "large");
  $("openHint").textContent = s.openHint || "";
  render(s);
});
</script>
</body>
</html>`;
}
