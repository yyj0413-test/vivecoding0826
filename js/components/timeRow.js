window.renderTimeRow = function (row) {
  return `
    <div class="time-row">
      <div class="time-cell">
        <span class="time-dot"></span>
        <strong>${row.time}</strong>
      </div>
      <div class="schedule-cell">${renderEventCard(row.first)}</div>
      <div class="schedule-cell">${renderEventCard(row.second)}</div>
      <div class="schedule-cell parent-cell">${renderDriveCard(row.parent)}</div>
    </div>
  `;
};
