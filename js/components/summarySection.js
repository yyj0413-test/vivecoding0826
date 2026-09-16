import { Conflict } from "../conflict.js";

const renderSummary = s => {
  let c = Conflict.cross(s);

  return `
    <section class="summary">
      <article>
        🚗
        <div>
          <small>등록 일정</small>
          <strong>${s.length}개</strong>
        </div>
      </article>

      <article class="${c.length ? "danger" : ""}">
        ${c.length ? "⚠" : "✓"}
        <div>
          <small>일정 충돌</small>
          <strong>${
            c.length ? c.length + "건 확인 필요" : "충돌 없음"
          }</strong>
        </div>
      </article>

      <article>
        ◷
        <div>
          <small>오늘의 상태</small>
          <strong>관리 가능</strong>
        </div>
      </article>
    </section>
  `;
};

export { renderSummary };