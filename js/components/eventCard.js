const renderEvent = e =>
  !e
    ? '<div class="empty"></div>'
    : `
      <div class="event-card" data-id="${e.id}">
        <div class="event-top">
          <strong>${e.title}</strong>
          <span>
            <button class="edit" data-id="${e.id}">✎</button>
            <button class="del" data-id="${e.id}">×</button>
          </span>
        </div>
        <small>
          ${e.place} · ${e.start}${e.end !== e.start ? "–" + e.end : ""}
        </small>
      </div>
    `;

export { renderEvent };