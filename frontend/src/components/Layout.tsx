import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="dot" />
          GS OPS
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            マイ勤怠
          </NavLink>
          {user?.role === "admin" && (
            <>
              <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>
                全員の勤怠
              </NavLink>
              <NavLink
                to="/admin/users"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                ユーザー管理
              </NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user-name">{user?.name}</div>
          <div>{user?.role === "admin" ? "管理者" : "スタッフ"}</div>
          <button
            className="btn btn-secondary btn-block"
            style={{ marginTop: 12 }}
            onClick={handleLogout}
          >
            ログアウト
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
