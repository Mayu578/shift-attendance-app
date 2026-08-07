import React, { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout";
import MonthNav from "../components/MonthNav";
import SummaryCards from "../components/SummaryCards";
import AttendanceBoard from "../components/AttendanceBoard";
import { api, AttendanceListResponse, User } from "../api";

const now = new Date();

interface AdminAllResponse {
  users: User[];
  data: Record<string, AttendanceListResponse>;
}

export default function AdminDashboard() {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [resp, setResp] = useState<AdminAllResponse | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<AdminAllResponse>("/attendance/admin/all", {
      params: { year, month },
    });
    setResp(res.data);
    if (res.data.users.length > 0 && selectedUserId === null) {
      setSelectedUserId(res.data.users[0].id);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = resp && selectedUserId !== null ? resp.data[String(selectedUserId)] : null;

  return (
    <Layout>
      <div className="page-header">
        <div className="page-eyebrow">Admin / 全員の勤怠</div>
        <h1 className="page-title">スタッフの勤怠一覧</h1>
        <p className="page-subtitle">スタッフを選択すると、月次の勤務・残業・インターバルを確認できます。</p>
      </div>

      <div className="field admin-user-select">
        <label>スタッフを選択</label>
        <select
          value={selectedUserId ?? ""}
          onChange={(e) => setSelectedUserId(Number(e.target.value))}
        >
          {resp?.users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}（{u.email}）
            </option>
          ))}
        </select>
      </div>

      <MonthNav
        year={year}
        month={month}
        onChange={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
      />

      {!loading && selected && (
        <>
          <SummaryCards summary={selected.summary} />
          <AttendanceBoard records={selected.records} />
        </>
      )}
    </Layout>
  );
}
