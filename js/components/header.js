window.renderHeader = function (data) {
  return `
    <header class="top-header">
      <div>
        <div class="eyebrow">TODAY · FAMILY SCHEDULE</div>
        <h1>오늘, 아이들을 위해<br><span>움직일 시간</span></h1>
        <p class="date-line">${data.dateLabel} <span>·</span> ${data.totalLabel}</p>
      </div>
      <button class="settings-button" type="button" aria-label="설정">⚙</button>
    </header>
    <section class="family-summary">
      ${data.family.map(child => `
        <div class="family-chip ${child.color}">
          <span class="avatar">${child.initial}</span>
          <div>
            <strong>${child.order} · ${child.name}</strong>
            <small>${child.id === "first" ? "영어학원" : "태권도"}</small>
          </div>
          <span class="chip-dot"></span>
        </div>
      `).join("")}
    </section>
  `;
};
