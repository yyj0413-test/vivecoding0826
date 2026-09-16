import { Conflict } from "../conflict.js";

const renderAlert = s => {
  let c = Conflict.cross(s);

  return c.length
    ? `
      <div class="alert">
        ⚠
        <div>
          <strong>픽업 일정이 겹칠 수 있어요</strong>
          ${c
            .map(
              x => `
                <p>${x.a.start} · ${x.a.title} ↔ ${x.b.title}</p>
              `
            )
            .join("")}
        </div>
      </div>
    `
    : "";
};

export { renderAlert };