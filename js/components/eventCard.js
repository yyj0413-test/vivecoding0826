window.renderEventCard = function (event) {
  if (!event) return `<div class="empty-cell"></div>`;

  const stateText = {
    upcoming: "예정",
    active: "진행 중",
    done: "완료",
    free: "자유시간"
  }[event.state] || "";

  return `
    <div class="event-card ${event.state} ${event.tall ? "tall" : ""}">
      <div class="event-top">
        <strong>${event.title}</strong>
        <span class="state-badge">${stateText}</span>
      </div>
      <span class="event-meta">${event.meta}</span>
    </div>
  `;
};
