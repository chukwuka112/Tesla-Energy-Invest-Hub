import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAdminGetAuditLogs, getAdminGetAuditLogsQueryKey, AuditLog } from "@workspace/api-client-react";
import { ShieldAlert, Search } from "lucide-react";

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useAdminGetAuditLogs(
    { page, limit: 30 },
    { query: { queryKey: getAdminGetAuditLogsQueryKey({ page, limit: 30 }) } }
  );

  const logs: AuditLog[] = Array.isArray(data) ? data : [];

  const actionColors: Record<string, string> = {
    approve_deposit: "text-green-400",
    reject_deposit: "text-primary",
    approve_withdrawal: "text-green-400",
    reject_withdrawal: "text-primary",
    suspend_user: "text-yellow-400",
    unsuspend_user: "text-blue-400",
    create_plan: "text-blue-400",
    delete_plan: "text-primary",
    create_gift_code: "text-blue-400",
    delete_gift_code: "text-primary",
    create_announcement: "text-green-400",
    delete_announcement: "text-primary",
    update_user_role: "text-yellow-400",
  };

  const filtered = search
    ? logs.filter((l) =>
        l.action.includes(search.toLowerCase()) ||
        l.admin_name?.toLowerCase().includes(search.toLowerCase()) ||
        (l.details && l.details.toLowerCase().includes(search.toLowerCase()))
      )
    : logs;

  return (
    <AdminLayout title="Audit Logs">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Audit Logs</h2>
            <p className="text-muted-foreground text-sm mt-1">Track all admin actions</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by action, admin, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded pl-10 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Time</th>
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Admin</th>
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Action</th>
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Target</th>
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-border rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <ShieldAlert className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No audit logs found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                      <div>{new Date(log.created_at).toLocaleDateString()}</div>
                      <div>{new Date(log.created_at).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">{log.admin_name ?? log.admin_id.slice(0, 8)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-mono ${actionColors[log.action] ?? "text-muted-foreground"}`}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-muted-foreground">{log.target_type}</div>
                      {log.target_id && <div className="text-xs text-muted-foreground font-mono opacity-60">{log.target_id.slice(0, 8)}</div>}
                    </td>
                    <td className="px-6 py-4">
                      {log.details ? (
                        <span className="text-xs text-muted-foreground font-mono truncate block max-w-xs">
                          {log.details}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm border border-border rounded disabled:opacity-40 hover:bg-white/5 transition-colors">Previous</button>
          <button disabled={logs.length < 30} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm border border-border rounded disabled:opacity-40 hover:bg-white/5 transition-colors">Next</button>
        </div>
      </div>
    </AdminLayout>
  );
}
