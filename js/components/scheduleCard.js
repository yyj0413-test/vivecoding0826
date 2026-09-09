window.renderScheduleCard = function (data) {
  return `
    <section class="schedule-card">
      ${renderScheduleHeader()}
      ${renderTimeline(data.rows)}
    </section>
  `;
};
