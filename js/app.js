const TYPE_FILTER = document.getElementById("filter-type");
const REGION_FILTER = document.getElementById("filter-region");
const EVENT_LIST = document.getElementById("event-list");
const META = document.getElementById("meta");
const STATUS = document.getElementById("status");

let allEvents = [];

function formatUpdatedAt(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function populateFilter(select, values) {
  const sorted = [...values].sort((a, b) => a.localeCompare(b, "en"));
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
    EVENT_LIST.innerHTML =
      '<li class="status">沒有符合篩選條件的賽事。</li>';
    return;
  }

  for (const event of events) {
    const item = document.createElement("li");
    item.className = "event-card";

    const title = event.url
      ? `<a href="${event.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(event.name)}</a>`
      : escapeHtml(event.name);

    const badges = [
      event.region ? `<span class="badge">${escapeHtml(event.region)}</span>` : "",
      event.streaming ? '<span class="badge badge--live">直播</span>' : "",
    ]
      .filter(Boolean)
      .join("");

    item.innerHTML = `
      <h2>${title}</h2>
      <p class="event-date">${escapeHtml(event.date)}</p>
      <p class="event-type">${escapeHtml(event.type)}</p>
      <div class="event-meta">
        ${event.location ? `<span>${escapeHtml(event.location)}</span>` : ""}
        ${badges}
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
  META.textContent = `共 ${filtered.length} / ${allEvents.length} 場賽事`;
}

async function loadEvents() {
  try {
    const response = await fetch("data/events.json", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    allEvents = payload.events || [];

    populateFilter(TYPE_FILTER, new Set(allEvents.map((event) => event.type)));
    populateFilter(
      REGION_FILTER,
      new Set(allEvents.map((event) => event.region).filter(Boolean))
    );

    TYPE_FILTER.addEventListener("change", applyFilters);
    REGION_FILTER.addEventListener("change", applyFilters);

    applyFilters();

    const updated = formatUpdatedAt(payload.updatedAt);
    META.textContent += updated ? ` · 更新：${updated}` : "";
  } catch (error) {
    STATUS.hidden = false;
    STATUS.textContent =
      "無法載入賽事資料。若為首次部署，請先執行 scripts/fetch_events.py 或等待 GitHub Actions 更新。";
    META.textContent = "載入失敗";
    console.error(error);
  }
}

loadEvents();
