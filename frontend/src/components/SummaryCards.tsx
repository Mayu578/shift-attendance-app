import React from "react";
import { MonthlySummary } from "../api";
import { formatMinutesAsHM } from "../utils";

export default function SummaryCards({ summary }: { summary: MonthlySummary }) {
  return (
    <div className="summary-grid">
      <div className="summary-card">
        <div className="summary-label">月間総勤務時間</div>
        <div className="summary-value">
          {formatMinutesAsHM(summary.total_worked_minutes)}
          <span className="summary-unit">h</span>
        </div>
      </div>
      <div className="summary-card">
        <div className="summary-label">月間残業時間</div>
        <div className={`summary-value ${summary.total_overtime_minutes > 0 ? "warn" : "good"}`}>
          {formatMinutesAsHM(summary.total_overtime_minutes)}
          <span className="summary-unit">h</span>
        </div>
      </div>
      <div className="summary-card">
        <div className="summary-label">最短インターバル</div>
        <div
          className={`summary-value ${
            summary.min_interval_minutes !== null && summary.min_interval_minutes < 660
              ? "warn"
              : "good"
          }`}
        >
          {formatMinutesAsHM(summary.min_interval_minutes)}
          <span className="summary-unit">h</span>
        </div>
      </div>
      <div className="summary-card">
        <div className="summary-label">インターバル警告件数</div>
        <div className={`summary-value ${summary.interval_warning_count > 0 ? "warn" : "good"}`}>
          {summary.interval_warning_count}
          <span className="summary-unit">件</span>
        </div>
      </div>
    </div>
  );
}
