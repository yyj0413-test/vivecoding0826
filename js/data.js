window.scheduleData = {
  dateLabel: "8월 19일 수요일",
  totalLabel: "오늘의 일정 6개",
  family: [
    { id: "first", order: "첫째", name: "민준", color: "blue", initial: "민" },
    { id: "second", order: "둘째", name: "서윤", color: "violet", initial: "서" }
  ],
  rows: [
    {
      time: "15:00",
      first: { type: "event", title: "영어학원 준비", meta: "집 · 15:00–15:30", state: "upcoming" },
      second: null,
      parent: { type: "drive", title: "첫째 학원 데려다주기", meta: "집 → 영어학원", duration: "15분", icon: "↗" }
    },
    {
      time: "15:30",
      first: { type: "event", title: "영어학원", meta: "영어학원 · 15:30–17:00", state: "active", tall: true },
      second: { type: "event", title: "태권도", meta: "태권도장 · 15:30–16:30", state: "active" },
      parent: null
    },
    {
      time: "16:00",
      first: null,
      second: { type: "event", title: "태권도", meta: "태권도장 · 진행 중", state: "active" },
      parent: { type: "drive", title: "첫째 학원 이동 확인", meta: "영어학원 도착", duration: "확인", icon: "✓" }
    },
    {
      time: "17:00",
      first: { type: "event", title: "영어학원 종료", meta: "영어학원 · 17:00", state: "done" },
      second: { type: "event", title: "태권도 종료", meta: "태권도장 · 17:00", state: "upcoming" },
      parent: { type: "drive", title: "첫째 데리러 가기", meta: "영어학원 → 집", duration: "20분", icon: "↙" }
    },
    {
      time: "17:30",
      first: null,
      second: { type: "event", title: "집으로 이동", meta: "태권도장 → 집 · 17:30", state: "upcoming" },
      parent: { type: "drive", title: "둘째 이동", meta: "태권도장 → 집", duration: "15분", icon: "↙" }
    },
    {
      time: "18:00",
      first: null,
      second: { type: "event", title: "저녁 / 자유시간", meta: "집 · 18:00 이후", state: "free" },
      parent: null
    }
  ],
  summary: [
    { icon: "🚗", label: "부모 이동", value: "3회", detail: "총 1시간 10분" },
    { icon: "✓", label: "픽업 가능", value: "모두 가능", detail: "시간 겹침 없음" },
    { icon: "◷", label: "아이 자유시간", value: "첫째 1시간 30분", detail: "둘째 30분" }
  ]
};
