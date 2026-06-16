import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAdminGetWithdrawals, useAdminApproveWithdrawal, useAdminRejectWithdrawal, getAdminGetWithdrawalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Clock, Filter } from "lucide-react";

export default function Withdrawals() {
  const [status, setStatus] = useState<string>("pending");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useAdminGetWithdrawals(
    { status: status || undefined, page },
    { query: { queryKey: getAdminGetWithdrawalsQueryKey({ status: status || undefined, page }) } }
  );

  const approve = useAdminApproveWithdrawal({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminGetWithdrawalsQueryKey() }) }
  });
  const reject = useAdminRejectWithdrawal({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminGetWithdrawalsQueryKey() }) }
  });

  const withdrawals = Array.isArray(data) ? data : [];

  return (
    <AdminLayout title="Withdrawals">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Withdrawal Management</h2>
            <p className="text-muted-foreground text-sm mt-1">{withdrawals.length} withdrawals</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {["all", "pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s === "all" ? "" : s); setPage(1); }}
              className={`px-3 py-1.5 text-xs rounded transition-colors capitalize ${
                (s === "all" ? !status : status === s)
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-card border border-border text-muted-foreground hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">ID</th>
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Amount</th>
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Wallet</th>
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Date</th>
                <th className="text-right px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-border rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No withdrawals found</td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-xs text-muted-foreground font-mono">{w.id.slice(0, 8)}…</div>
                      <div className="text-xs text-muted-foreground opacity-60">{w.user_id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">
                      ${Number(w.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-muted-foreground font-mono truncate max-w-[160px]">
                        {w.wallet_address}
                      </div>
                      {w.network && <div className="text-xs text-muted-foreground opacity-60 uppercase">{w.network}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={w.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(w.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {w.status === "pending" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => approve.mutate({ id: w.id })}
                            disabled={approve.isPending}
                            className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-400/10 border border-green-400/20 hover:bg-green-400/20 rounded px-3 py-1.5 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="h-3 w-3" /> Approve
                          </button>
                          <button
                            onClick={() => reject.mutate({ id: w.id })}
                            disabled={reject.isPending}
                            className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 rounded px-3 py-1.5 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="h-3 w-3" /> Reject
                          </button>
                        </div>
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
          <button disabled={withdrawals.length < 20} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm border border-border rounded disabled:opacity-40 hover:bg-white/5 transition-colors">Next</button>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return <span className="inline-flex items-center gap-1 text-xs text-green-400"><CheckCircle className="h-3 w-3" /> Approved</span>;
  if (status === "pending") return <span className="inline-flex items-center gap-1 text-xs text-yellow-400"><Clock className="h-3 w-3" /> Pending</span>;
  if (status === "rejected") return <span className="inline-flex items-center gap-1 text-xs text-primary"><XCircle className="h-3 w-3" /> Rejected</span>;
  return <span className="text-xs text-muted-foreground">{status}</span>;
}
