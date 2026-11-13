"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { Alert, Badge, Button, Input, PageLoader, SectionHeading, Select } from "@/components/ui";
import { formatDate } from "@/lib/format";

interface U { id: number; name: string; email: string; role: string; isActive: boolean; createdAt: string }

function Content() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState<U[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const load = useCallback(() => api<U[]>("/admin/users").then(setRows).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  async function update(id: number, patch: Partial<U>) {
    try { await api(`/admin/users/${id}`, { method: "PATCH", json: patch }); toast("User updated", "success"); load(); }
    catch (e) { toast(e instanceof Error ? e.message : "Update failed", "error"); }
  }
  async function remove(id: number) {
    if (!confirm("Delete this user and all their data?")) return;
    try { await api(`/admin/users/${id}`, { method: "DELETE" }); toast("User deleted", "success"); load(); }
    catch (e) { toast(e instanceof Error ? e.message : "Delete failed", "error"); }
  }

  if (error) return <Alert>{error}</Alert>;
  if (!rows) return <PageLoader />;
  const shown = rows.filter((u) => (role === "all" || u.role === role) && (!q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())));

  return (
    <>
      <SectionHeading eyebrow="Users" title="User management" description={`${rows.length} accounts`} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} className="sm:max-w-xs" />
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="sm:max-w-[180px]">
          <option value="all">All roles</option><option value="student">Students</option><option value="instructor">Instructors</option><option value="admin">Admins</option>
        </Select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-charcoal">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
              <th className="px-5 py-3">User</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Joined</th><th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map((u) => (
              <tr key={u.id} className="hover:bg-slate/40">
                <td className="px-5 py-3"><p className="text-ivory">{u.name}{u.id === me?.id && <span className="ml-2 text-xs text-muted">(you)</span>}</p><p className="text-xs text-muted">{u.email}</p></td>
                <td className="px-5 py-3">
                  <select value={u.role} disabled={u.id === me?.id} onChange={(e) => update(u.id, { role: e.target.value })} className="rounded border border-line bg-ink px-2 py-1 text-xs text-ivory disabled:opacity-50">
                    <option value="student">student</option><option value="instructor">instructor</option><option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-5 py-3">{u.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Deactivated</Badge>}</td>
                <td className="px-5 py-3 text-muted">{formatDate(u.createdAt)}</td>
                <td className="px-5 py-3 text-right">
                  {u.id !== me?.id && (
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="secondary" onClick={() => update(u.id, { isActive: !u.isActive })}>{u.isActive ? "Deactivate" : "Reactivate"}</Button>
                      <Button size="sm" variant="danger" onClick={() => remove(u.id)}>Delete</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-muted">No users match.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function Page() {
  return <AppShell roles={["admin"]} title="Users"><Content /></AppShell>;
}
