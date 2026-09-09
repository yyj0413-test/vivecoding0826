학부모용 두 자녀 일정·이동 관리 서비스
====================================

이 버전은 React, Vue, Vite 등 프레임워크를 사용하지 않는
순수 HTML + CSS + JavaScript(바닐라 JS) 버전입니다.

실행 방법
1. 압축을 풉니다.
2. index.html을 더블클릭합니다.
3. Chrome/Edge 등 브라우저에서 바로 실행됩니다.

폴더 구조
- index.html
- css/style.css
- js/data.js
- js/app.js
- js/components/header.js
- js/components/scheduleHeader.js
- js/components/eventCard.js
- js/components/driveCard.js
- js/components/timeRow.js
- js/components/timeline.js
- js/components/scheduleCard.js
- js/components/summarySection.js

컴포넌트 방식
각 UI 영역을 JS 함수로 분리하고 app.js에서 조립합니다.
React 같은 프레임워크는 필요하지 않습니다.

데이터 수정
js/data.js의 scheduleData를 수정하면 아이 이름, 일정, 이동 정보,
요약 카드 등을 변경할 수 있습니다.
