import { familyData } from "../data.js";

const renderHeader = () => `
  <header class="top-header">
    <div>
      <div class="eyebrow">TODAY · FAMILY SCHEDULE</div>
      <h1>오늘, 아이들을 위해<br><span>움직일 시간</span></h1>
      <p class="date-line" id="headerDate"></p>
    </div>
    <button class="settings-button" id="resetData">↺</button>
  </header>

  <section class="family-summary">
    ${familyData.children.map(c => `
      <div class="family-chip ${c.color}">
        <span class="avatar">${c.name[0]}</span>
        <div>
          <strong>${c.order} · ${c.name}</strong>
          <small>${c.academy}</small>
        </div>
        <i></i>
      </div>
    `).join("")}
  </section>
`;

export { renderHeader };