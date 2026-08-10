import React, { useEffect, useState } from "react";
import { AttendanceRecord } from "../api";
import { combineDateAndTimeRange, toTimeValue } from "../utils";

// 呼び出し元(StaffDashboard)に渡す値は、これまでと同じく完全なdatetime文字列
export interface AttendanceFormValues {
  work_date: string;
  scheduled_start: string;
  scheduled_end: string;
  clock_in: string;
  clock_out: string;
  break_minutes: number;
  note: string;
}

// フォーム内部では、日付は「勤務日」1箇所だけ、あとは時刻のみを扱う
interface InternalValues {
  work_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  clock_in_time: string;
  clock_out_time: string;
  break_minutes: number;
  note: string;
}

interface Props {
  editing: AttendanceRecord | null;
  onSubmit: (values: AttendanceFormValues) => Promise<void>;
  onCancelEdit: () => void;
}

function emptyValues(): InternalValues {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  return {
    work_date: dateStr,
    scheduled_start_time: "",
    scheduled_end_time: "",
    clock_in_time: "",
    clock_out_time: "",
    break_minutes: 0,
    note: "",
  };
}

export default function AttendanceForm({ editing, onSubmit, onCancelEdit }: Props) {
  const [values, setValues] = useState<InternalValues>(emptyValues());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setValues({
        work_date: editing.work_date,
        scheduled_start_time: toTimeValue(editing.scheduled_start),
        scheduled_end_time: toTimeValue(editing.scheduled_end),
        clock_in_time: toTimeValue(editing.clock_in),
        clock_out_time: toTimeValue(editing.clock_out),
        break_minutes: editing.break_minutes,
        note: editing.note ?? "",
      });
    } else {
      setValues(emptyValues());
    }
  }, [editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!values.clock_in_time) {
      setError("出勤時刻を入力してください");
      return;
    }
    setSubmitting(true);
    try {
      const scheduled = combineDateAndTimeRange(
        values.work_date,
        values.scheduled_start_time,
        values.scheduled_end_time
      );
      const actual = combineDateAndTimeRange(
        values.work_date,
        values.clock_in_time,
        values.clock_out_time
      );
      await onSubmit({
        work_date: values.work_date,
        scheduled_start: scheduled.start,
        scheduled_end: scheduled.end,
        clock_in: actual.start,
        clock_out: actual.end,
        break_minutes: values.break_minutes,
        note: values.note,
      });
      if (!editing) setValues(emptyValues());
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="entry-panel">
      <h3 className="entry-panel-title">{editing ? "打刻を編集" : "打刻を登録"}</h3>
      <p className="page-subtitle" style={{ marginTop: -8, marginBottom: 16 }}>
        日付は「勤務日」だけでOKです。他の時刻欄には時間だけ入力してください（終了時刻が開始時刻より前なら、翌日に日をまたいだものとして自動計算します）。
      </p>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="entry-grid">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>勤務日</label>
            <input
              type="date"
              value={values.work_date}
              onChange={(e) => setValues({ ...values, work_date: e.target.value })}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>予定出勤（シフト表通り）</label>
            <input
              type="time"
              value={values.scheduled_start_time}
              onChange={(e) => setValues({ ...values, scheduled_start_time: e.target.value })}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>予定退勤（シフト表通り）</label>
            <input
              type="time"
              value={values.scheduled_end_time}
              onChange={(e) => setValues({ ...values, scheduled_end_time: e.target.value })}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>実際の出勤</label>
            <input
              type="time"
              value={values.clock_in_time}
              onChange={(e) => setValues({ ...values, clock_in_time: e.target.value })}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>実際の退勤</label>
            <input
              type="time"
              value={values.clock_out_time}
              onChange={(e) => setValues({ ...values, clock_out_time: e.target.value })}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>休憩(分)</label>
            <input
              type="number"
              min={0}
              value={values.break_minutes}
              onChange={(e) =>
                setValues({ ...values, break_minutes: Number(e.target.value) })
              }
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>メモ</label>
            <input
              value={values.note}
              onChange={(e) => setValues({ ...values, note: e.target.value })}
              placeholder="任意"
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {editing ? "更新する" : "登録する"}
            </button>
            {editing && (
              <button type="button" className="btn btn-secondary" onClick={onCancelEdit}>
                キャンセル
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
