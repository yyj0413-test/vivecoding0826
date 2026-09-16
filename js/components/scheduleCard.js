import { renderScheduleHeader } from "./scheduleHeader.js";
import { renderTimeline } from "./timeline.js";

const renderScheduleCard = (s, d) => `
  <section class="schedule-card">
    ${renderScheduleHeader()}
    ${renderTimeline(s, d)}
    <div class="add-area">
      <button id="addSchedule">＋ 일정 추가</button>
    </div>
  </section>
`;

export { renderScheduleCard };