const TYPE_FILTER = document.getElementById("filter-type");
const REGION_FILTER = document.getElementById("filter-region");
const EVENT_LIST = document.getElementById("event-list");
const META = document.getElementById("meta");
const STATUS = document.getElementById("status");
const STAT_COUNT = document.getElementById("stat-count");
const STAT_UPDATED = document.getElementById("stat-updated");

let allEvents = [];

function formatUpdatedAt(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function populateFilter(select, values) {
  const sorted = [...values].sort((a, b) => a.localeCompare(b, "zh-Hant"));
  for (const value of sorted) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }
}

function renderEvents(events) {
  EVENT_LIST.innerHTML = "";

  if (events.length === 0) {
    EVENT_LIST.innerHTML = '<li class="empty-state">沒有符合篩選條件的賽事。</li>';
    return;
  }

  for (const event of events) {
    const item = document.createElement("li");
    item.className = "schedule-item";

    const titleHtml = event.url
      ? `<a href="${escapeHtml(event.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(event.name)}</a>`
      : escapeHtml(event.name);

    const liveTag = event.streaming ? '<span class="tag-live">直播</span>' : "";
    const detailLink = event.url
      ? `<a class="event-link" href="${escapeHtml(event.url)}" target="_blank" rel="noopener noreferrer">官方詳情</a>`
      : "";

    item.innerHTML = `
      <p class="event-date">${escapeHtml(event.date)}</p>
      <div class="event-main">
        <h2 class="event-title">${titleHtml}${liveTag}</h2>
        <div class="event-sub">
          ${detailLink}
        </div>
      </div>
      <p class="event-type">${escapeHtml(event.type)}</p>
      <div>
        <p class="event-location">${event.location ? escapeHtml(event.location) : "—"}</p>
        ${event.region ? `<span class="event-region">${escapeHtml(event.region)}</span>` : ""}
      </div>
    `;

    EVENT_LIST.appendChild(item);
  }
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function applyFilters() {
  const typeValue = TYPE_FILTER.value;
  const regionValue = REGION_FILTER.value;

  const filtered = allEvents.filter((event) => {
    const typeMatch = !typeValue || event.type === typeValue;
    const regionMatch = !regionValue || event.region === regionValue;
    return typeMatch && regionMatch;
  });

  renderEvents(filtered);
  META.textContent = `顯示 ${filtered.length} / ${allEvents.length} 場`;
}

async function loadEvents() {
  try {
    const response = await fetch("data/events.json", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    allEvents = payload.events || [];

    STAT_COUNT.textContent = String(allEvents.length);
    STAT_UPDATED.textContent = formatUpdatedAt(payload.updatedAt);

    populateFilter(TYPE_FILTER, new Set(allEvents.map((event) => event.type)));
    populateFilter(
      REGION_FILTER,
      new Set(allEvents.map((event) => event.region).filter(Boolean))
    );

    TYPE_FILTER.addEventListener("change", applyFilters);
    REGION_FILTER.addEventListener("change", applyFilters);

    applyFilters();
  } catch (error) {
    STATUS.hidden = false;
    STATUS.textContent =
      "無法載入賽事資料。若為首次部署，請先執行 scripts/fetch_events.py，或等待 GitHub Actions 更新。";
    META.textContent = "載入失敗";
    STAT_COUNT.textContent = "—";
    STAT_UPDATED.textContent = "—";
    console.error(error);
  }
}

loadEvents();
