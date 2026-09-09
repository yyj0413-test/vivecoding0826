window.renderSummarySection = function (items) {
  return `
    <section class="summary-section">
      ${items.map(item => `
        <article class="summary-card">
          <div class="summary-icon">${item.icon}</div>
          <div class="summary-copy">
            <span>${item.label}</span>
            <strong>${item.value}</strong>
            <small>${item.detail}</small>
          </div>
        </article>
      `).join("")}
    </section>
    <footer class="app-footer">
      <span>●</span> 오늘 일정 기준 · 실시간으로 확인하세요
    </footer>
  `;
};
