import axios from "axios";

// VercelではVITE_API_BASE_URLに、RenderにデプロイしたバックエンドのURLを設定する
// 例: https://attendance-api.onrender.com
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type UserRole = "staff" | "admin";

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  standard_work_minutes: number;
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  user_id: number;
  work_date: string;
  clock_in: string;
  clock_out: string | null;
  break_minutes: number;
  note: string | null;
  worked_minutes: number | null;
  overtime_minutes: number | null;
  interval_minutes_before: number | null;
  interval_warning: boolean | null;
}

export interface MonthlySummary {
  year: number;
  month: number;
  total_worked_minutes: number;
  total_overtime_minutes: number;
  record_count: number;
  min_interval_minutes: number | null;
  interval_warning_count: number;
}

export interface AttendanceListResponse {
  records: AttendanceRecord[];
  summary: MonthlySummary;
}
