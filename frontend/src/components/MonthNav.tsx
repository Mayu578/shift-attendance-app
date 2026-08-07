import React from "react";

interface Props {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

export default function MonthNav({ year, month, onChange }: Props) {
  function shift(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    onChange(newYear, newMonth);
  }

  return (
    <div className="month-nav">
      <button className="btn btn-secondary" onClick={() => shift(-1)}>
        ← 前月
      </button>
      <div className="current-month">
        {year}年{month}月
      </div>
      <button className="btn btn-secondary" onClick={() => shift(1)}>
        翌月 →
      </button>
    </div>
  );
}
