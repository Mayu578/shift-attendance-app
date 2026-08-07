import React, { useEffect, useState } from "react";
import { AttendanceRecord } from "../api";
import { toDatetimeLocalValue } from "../utils";

export interface AttendanceFormValues {
  work_date: string;
  clock_in: string;
  clock_out: string;
  break_minutes: number;
  note: string;
}

interface Props {
  editing: AttendanceRecord | null;
  onSubmit: (values: AttendanceFormValues) => Promise<void>;
  onCancelEdit: () => void;
}

function emptyValues(): AttendanceFormValues {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  return { work_date: dateStr, clock_in: "", clock_out: "", break_minutes: 0, note: "" };
}

export default function AttendanceForm({ editing, onSubmit, onCancelEdit }: Props) {
  const [values, setValues] = useState<AttendanceFormValues>(emptyValues());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setValues({
        work_date: editing.work_date,
        clock_in: toDatetimeLocalValue(editing.clock_in),
        clock_out: toDatetimeLocalValue(editing.clock_out),
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
    if (!values.clock_in) {
      setError("出勤時刻を入力してください");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
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
            <label>出勤</label>
            <input
              type="datetime-local"
              value={values.clock_in}
              onChange={(e) => setValues({ ...values, clock_in: e.target.value })}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>退勤</label>
            <input
              type="datetime-local"
              value={values.clock_out}
              onChange={(e) => setValues({ ...values, clock_out: e.target.value })}
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
