import React, { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout";
import MonthNav from "../components/MonthNav";
import SummaryCards from "../components/SummaryCards";
import AttendanceBoard from "../components/AttendanceBoard";
import AttendanceForm, { AttendanceFormValues } from "../components/AttendanceForm";
import { api, AttendanceListResponse, AttendanceRecord } from "../api";

const now = new Date();

export default function StaffDashboard() {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<AttendanceListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<AttendanceListResponse>("/attendance", {
      params: { year, month },
    });
    setData(res.data);
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(values: AttendanceFormValues) {
    const payload = {
      work_date: values.work_date,
      clock_in: values.clock_in,
      clock_out: values.clock_out || null,
      break_minutes: values.break_minutes,
      note: values.note || null,
    };
    if (editing) {
      await api.put(`/attendance/${editing.id}`, payload);
      setEditing(null);
    } else {
      await api.post("/attendance", payload);
    }
    await load();
  }

  async function handleDelete(record: AttendanceRecord) {
    if (!confirm("この記録を削除しますか？")) return;
    await api.delete(`/attendance/${record.id}`);
    await load();
  }

  return (
    <Layout>
      <div className="page-header">
        <div className="page-eyebrow">Attendance / 自分の勤怠</div>
        <h1 className="page-title">マイ勤怠</h1>
        <p className="page-subtitle">
          出勤・退勤を記録すると、残業時間と次のシフトまでのインターバルを自動で計算します。
        </p>
      </div>

      <AttendanceForm
        editing={editing}
        onSubmit={handleSubmit}
        onCancelEdit={() => setEditing(null)}
      />

      <MonthNav
        year={year}
        month={month}
        onChange={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
      />

      {!loading && data && (
        <>
          <SummaryCards summary={data.summary} />
          <AttendanceBoard
            records={data.records}
            onEdit={(r) => setEditing(r)}
            onDelete={handleDelete}
          />
        </>
      )}
    </Layout>
  );
}
