export const Calendar = {
  date: new Date(),

  label(d) {
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${
      ["일", "월", "화", "수", "목", "금", "토"][d.getDay()]
    }요일`;
  },

  move(n) {
    this.date.setDate(this.date.getDate() + n);
  },

  today() {
    this.date = new Date();
  }
};