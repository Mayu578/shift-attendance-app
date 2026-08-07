import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api, User, UserRole } from "../api";
import { useAuth } from "../context/AuthContext";

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await api.get<User[]>("/users");
    setUsers(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleRole(u: User) {
    const newRole: UserRole = u.role === "admin" ? "staff" : "admin";
    await api.patch(`/users/${u.id}/role`, { role: newRole });
    await load();
  }

  async function toggleActive(u: User) {
    await api.patch(`/users/${u.id}/active`, { is_active: !u.is_active });
    await load();
  }

  async function removeUser(u: User) {
    if (!confirm(`${u.name} さんを削除しますか？この操作は取り消せません。`)) return;
    await api.delete(`/users/${u.id}`);
    await load();
  }

  return (
    <Layout>
      <div className="page-header">
        <div className="page-eyebrow">Admin / ユーザー管理</div>
        <h1 className="page-title">ユーザー管理</h1>
        <p className="page-subtitle">
          新しいスタッフは各自ログイン画面から「新規登録」でアカウントを作成できます。
        </p>
      </div>

      {!loading && (
        <table className="user-table">
          <thead>
            <tr>
              <th>氏名</th>
              <th>メールアドレス</th>
              <th>権限</th>
              <th>状態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`tag ${u.role === "admin" ? "tag-ok" : ""}`}>
                    {u.role === "admin" ? "管理者" : "スタッフ"}
                  </span>
                </td>
                <td>
                  <span className={`tag ${u.is_active ? "tag-ok" : "tag-warn"}`}>
                    {u.is_active ? "有効" : "無効"}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn" onClick={() => toggleRole(u)}>
                      {u.role === "admin" ? "スタッフにする" : "管理者にする"}
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => toggleActive(u)}
                      disabled={u.id === currentUser?.id}
                    >
                      {u.is_active ? "無効化" : "有効化"}
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => removeUser(u)}
                      disabled={u.id === currentUser?.id}
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Layout>
  );
}
