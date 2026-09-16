import { renderEvent } from "./eventCard.js";
import { renderDrive } from "./driveCard.js";

const renderRow = (t, s, d) => `
  <div class="time-row">
    <div class="time">
      <i></i>${t}
    </div>
    <div>
      ${renderEvent(s.find(x => x.childId === "first" && x.start === t))}
    </div>
    <div>
      ${renderEvent(s.find(x => x.childId === "second" && x.start === t))}
    </div>
    <div>
      ${renderDrive(d.find(x => x.start === t))}
    </div>
  </div>
`;

export { renderRow };