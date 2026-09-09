window.renderTimeline = function (rows) {
  return `
    <div class="timeline">
      ${rows.map(renderTimeRow).join("")}
    </div>
  `;
};
