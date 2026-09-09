document.addEventListener("DOMContentLoaded", function () {
  const app = document.getElementById("app");

  app.innerHTML = `
    <main class="app-shell">
      ${renderHeader(scheduleData)}
      ${renderScheduleCard(scheduleData)}
      ${renderSummarySection(scheduleData.summary)}
    </main>
  `;

  document.querySelector(".settings-button")?.addEventListener("click", function () {
    alert("설정 화면은 다음 단계에서 연결할 수 있습니다.");
  });

  document.querySelector(".today-button")?.addEventListener("click", function () {
    alert("오늘 일정이 표시되고 있습니다.");
  });
});
