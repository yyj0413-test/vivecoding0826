window.renderScheduleHeader = function () {
  return `
    <div class="schedule-title-row">
      <div>
        <span class="section-kicker">INTEGRATED VIEW</span>
        <h2>아이들 일정 한눈에 보기</h2>
      </div>
      <button class="today-button" type="button">오늘 <span>⌄</span></button>
    </div>
    <div class="column-header">
      <div>시간</div>
      <div><span class="mini-avatar blue">민</span> 첫째 · 민준</div>
      <div><span class="mini-avatar violet">서</span> 둘째 · 서윤</div>
      <div>부모 이동</div>
    </div>
  `;
};
