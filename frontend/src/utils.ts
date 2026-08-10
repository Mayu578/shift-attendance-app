export function formatMinutesAsHM(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "--:--";
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}:${String(m).padStart(2, "0")}`;
}

export function formatDateTimeAsHM(iso: string | null): string {
  if (!iso) return "--:--";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
}

// datetime-local入力用の値(YYYY-MM-DDTHH:mm)に変換
export function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// time入力用の値(HH:mm)に変換
export function toTimeValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 勤務日 + 開始/終了の時刻(HH:mm)から、日をまたぐ夜勤も考慮してdatetime文字列を組み立てる
export function combineDateAndTimeRange(
  workDate: string,
  startTime: string,
  endTime: string
): { start: string; end: string } {
  const start = startTime ? `${workDate}T${startTime}` : "";

  if (!endTime) {
    return { start, end: "" };
  }
  if (!startTime) {
    return { start, end: `${workDate}T${endTime}` };
  }

  let endDateStr = workDate;
  if (endTime <= startTime) {
    // 終了時刻が開始時刻以前 → 日をまたいだとみなし、翌日の日付にする
    const d = new Date(workDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    endDateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  return { start, end: `${endDateStr}T${endTime}` };
}

export function formatCurrency(yen: number | null | undefined): string {
  if (yen === null || yen === undefined) return "―";
  return `¥${yen.toLocaleString("ja-JP")}`;
}
