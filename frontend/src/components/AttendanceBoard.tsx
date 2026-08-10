import React from "react";
import { AttendanceRecord } from "../api";
import { formatCurrency, formatDate, formatDateTimeAsHM, formatMinutesAsHM } from "../utils";

interface Props {
  records: AttendanceRecord[];
  onEdit?: (record: AttendanceRecord) => void;
  onDelete?: (record: AttendanceRecord) => void;
}

const GRID_WITH_ACTIONS = "90px 1fr 1fr 70px 90px 90px 100px 90px 110px";
const GRID_NO_ACTIONS = "90px 1fr 1fr 70px 90px 90px 100px 90px";

export default function AttendanceBoard({ records, onEdit, onDelete }: Props) {
  const showActions = Boolean(onEdit || onDelete);
  const gridStyle = { gridTemplateColumns: showActions ? GRID_WITH_ACTIONS : GRID_NO_ACTIONS };

  return (
    <div className="board">
      <div className="board-row header" style={gridStyle}>
        <div>日付</div>
        <div>予定シフト</div>
        <div>実績</div>
        <div>休憩</div>
        <div>実働</div>
        <div>残業</div>
        <div>日給</div>
        <div>インターバル</div>
        {showActions && <div>操作</div>}
      </div>

      {records.length === 0 && <div className="empty-state">この月の記録はまだありません</div>}

      {records.map((r) => (
        <div className="board-row body" key={r.id} style={gridStyle}>
          <div>{formatDate(r.work_date)}</div>
          <div className="flip-time">
            {r.scheduled_start ? (
              <>
                {formatDateTimeAsHM(r.scheduled_start)}
                <span className="sep">–</span>
                {formatDateTimeAsHM(r.scheduled_end)}
              </>
            ) : (
              <span style={{ color: "var(--text-secondary)" }}>未設定</span>
            )}
          </div>
          <div className="flip-time">
            {formatDateTimeAsHM(r.clock_in)}
            <span className="sep">–</span>
            {formatDateTimeAsHM(r.clock_out)}
          </div>
          <div>{r.break_minutes}分</div>
          <div className="flip-time">{formatMinutesAsHM(r.worked_minutes)}</div>
          <div>
            {r.overtime_minutes === null ? (
              <span style={{ color: "var(--text-secondary)" }}>―</span>
            ) : (
              <span className={`tag ${r.overtime_minutes > 0 ? "tag-warn" : "tag-ok"}`}>
                {formatMinutesAsHM(r.overtime_minutes)}
              </span>
            )}
          </div>
          <div className="flip-time">{formatCurrency(r.earnings)}</div>
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
