import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAdminGetUsers, useAdminUpdateUser, getAdminGetUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, ChevronDown, Shield, Ban, CheckCircle } from "lucide-react";

export default function Users() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useAdminGetUsers(
    { search: search || undefined, page, limit: 20 },
    { query: { queryKey: getAdminGetUsersQueryKey({ search: search || undefined, page, limit: 20 }) } }
  );

  const updateUser = useAdminUpdateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
        setSelectedUser(null);
      }
    }
  });

  const handleToggleActive = (id: string, isActive: boolean) => {
    updateUser.mutate({ id, data: { is_active: !isActive } });
  };

  const users = data?.users ?? [];
  const total = data?.total ?? 0;

  return (
    <AdminLayout title="Users">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-white">User Management</h2>
            <p className="text-muted-foreground text-sm mt-1">{total} total users</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-card border border-border rounded pl-10 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">User</th>
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Role</th>
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Balance</th>
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Joined</th>
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-border rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                          {(user.full_name?.[0] || user.email?.[0] || "?").toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {user.full_name || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      ${Number(user.balance ?? 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {!user.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs text-primary">
                          <Ban className="h-3 w-3" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle className="h-3 w-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-white bg-border hover:bg-white/10 rounded px-3 py-1.5 transition-colors"
                        >
                          Actions <ChevronDown className="h-3 w-3" />
                        </button>
                        {selectedUser === user.id && (
                          <div className="absolute right-0 top-full mt-1 z-10 bg-card border border-border rounded-lg shadow-xl min-w-[160px] overflow-hidden">
                            <button
                              onClick={() => handleToggleActive(user.id, user.is_active)}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
                            >
                              {!user.is_active ? (
                                <><CheckCircle className="h-3.5 w-3.5 text-green-400" /> Activate</>
                              ) : (
                                <><Ban className="h-3.5 w-3.5 text-primary" /> Suspend</>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                updateUser.mutate({ id: user.id, data: { role: user.role === "admin" ? "user" : "admin" } });
                                setSelectedUser(null);
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
                            >
                              <Shield className="h-3.5 w-3.5 text-yellow-400" />
                              {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 20 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-sm border border-border rounded disabled:opacity-40 hover:bg-white/5 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page * 20 >= total}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-sm border border-border rounded disabled:opacity-40 hover:bg-white/5 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function RoleBadge({ role }: { role?: string }) {
  if (role === "super_admin") return <span className="text-xs bg-primary/20 text-primary border border-primary/30 rounded px-2 py-0.5">Super Admin</span>;
  if (role === "admin") return <span className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded px-2 py-0.5">Admin</span>;
  return <span className="text-xs text-muted-foreground">User</span>;
}
