window.renderDriveCard = function (drive) {
  if (!drive) return `<div class="empty-cell"></div>`;

  return `
    <div class="drive-card">
      <div class="drive-icon">${drive.icon}</div>
      <div class="drive-content">
        <strong>${drive.title}</strong>
        <span>${drive.meta}</span>
      </div>
      <span class="drive-duration">${drive.duration}</span>
    </div>
  `;
};
