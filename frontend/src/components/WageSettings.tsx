import React, { useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function WageSettings() {
  const { user, setUser } = useAuth();
  const [hourlyWage, setHourlyWage] = useState(String(user?.hourly_wage ?? 0));
  const [overtimeWage, setOvertimeWage] = useState(String(user?.overtime_hourly_wage ?? 0));
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSaved(false);
    try {
      const res = await api.patch("/auth/me/wage", {
        hourly_wage: Number(hourlyWage) || 0,
        overtime_hourly_wage: Number(overtimeWage) || 0,
      });
      setUser(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="entry-panel">
      <h3 className="entry-panel-title">時給の設定</h3>
      <form onSubmit={handleSave}>
        <div className="entry-grid">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>時給（円）</label>
            <input
              type="number"
              min={0}
              value={hourlyWage}
              onChange={(e) => setHourlyWage(e.target.value)}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>残業時給（円）</label>
            <input
              type="number"
              min={0}
              value={overtimeWage}
              onChange={(e) => setOvertimeWage(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {saved ? "保存しました" : "保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}
