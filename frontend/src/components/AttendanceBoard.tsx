import React from "react";
import { AttendanceRecord } from "../api";
import { formatDate, formatDateTimeAsHM, formatMinutesAsHM } from "../utils";

interface Props {
  records: AttendanceRecord[];
  onEdit?: (record: AttendanceRecord) => void;
  onDelete?: (record: AttendanceRecord) => void;
}

export default function AttendanceBoard({ records, onEdit, onDelete }: Props) {
  const showActions = Boolean(onEdit || onDelete);

  return (
    <div className="board">
      <div
        className="board-row header"
        style={
          showActions
            ? undefined
            : { gridTemplateColumns: "100px 1fr 1fr 90px 90px 110px" }
        }
      >
        <div>日付</div>
        <div>出勤</div>
        <div>退勤</div>
        <div>休憩</div>
        <div>実働</div>
        <div>インターバル</div>
        {showActions && <div>操作</div>}
      </div>

      {records.length === 0 && <div className="empty-state">この月の記録はまだありません</div>}

      {records.map((r) => (
        <div
          className="board-row body"
          key={r.id}
          style={
            showActions
              ? undefined
              : { gridTemplateColumns: "100px 1fr 1fr 90px 90px 110px" }
          }
        >
          <div>{formatDate(r.work_date)}</div>
          <div className="flip-time">{formatDateTimeAsHM(r.clock_in)}</div>
          <div className="flip-time">{formatDateTimeAsHM(r.clock_out)}</div>
          <div>{r.break_minutes}分</div>
          <div className="flip-time">{formatMinutesAsHM(r.worked_minutes)}</div>
          <div>
            {r.interval_minutes_before === null ? (
              <span style={{ color: "var(--text-secondary)" }}>―</span>
            ) : (
              <span className={`tag ${r.interval_warning ? "tag-warn" : "tag-ok"}`}>
                {formatMinutesAsHM(r.interval_minutes_before)}
                {r.interval_warning ? " 短い" : ""}
              </span>
            )}
          </div>
          {showActions && (
            <div className="row-actions">
              {onEdit && (
                <button className="icon-btn" onClick={() => onEdit(r)}>
                  編集
                </button>
              )}
              {onDelete && (
                <button className="icon-btn" onClick={() => onDelete(r)}>
                  削除
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
