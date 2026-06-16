import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAdminGetGiftCodes, useAdminCreateGiftCode, useAdminDeleteGiftCode, getAdminGetGiftCodesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Copy, Check, Gift } from "lucide-react";

export default function GiftCodes() {
  const [showForm, setShowForm] = useState(false);
  const [rewardAmount, setRewardAmount] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: giftCodes, isLoading } = useAdminGetGiftCodes();

  const createGiftCode = useAdminCreateGiftCode({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminGetGiftCodesQueryKey() });
        setShowForm(false);
        setRewardAmount("");
        setMaxUses("1");
        setExpiresAt("");
      }
    }
  });

  const deleteGiftCode = useAdminDeleteGiftCode({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminGetGiftCodesQueryKey() });
        setDeleteId(null);
      }
    }
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 30);
    createGiftCode.mutate({ data: {
      reward_amount: Number(rewardAmount),
      max_uses: Number(maxUses),
      expires_at: expiresAt || defaultExpiry.toISOString(),
    }});
  };

  const codes = Array.isArray(giftCodes) ? giftCodes : [];

  return (
    <AdminLayout title="Gift Codes">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Gift Codes</h2>
            <p className="text-muted-foreground text-sm mt-1">Create credit vouchers for users</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2.5 rounded transition-colors"
          >
            <Plus className="h-4 w-4" /> Create Code
          </button>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-white mb-5">Create Gift Code</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Reward Amount ($)</label>
                  <input type="number" value={rewardAmount} onChange={e => setRewardAmount(e.target.value)} required min="1" step="0.01"
                    className="w-full bg-background border border-border rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60 transition-colors"
                    placeholder="e.g. 50" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Max Uses</label>
                  <input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} required min="1"
                    className="w-full bg-background border border-border rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Expires At (optional)</label>
                  <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                    className="w-full bg-background border border-border rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60 transition-colors" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-sm border border-border rounded text-muted-foreground hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createGiftCode.isPending}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded transition-colors">
                  <Gift className="h-4 w-4" /> {createGiftCode.isPending ? "Creating..." : "Create Code"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Code</th>
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Reward</th>
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Uses</th>
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Expires</th>
                <th className="text-left px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-border rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : codes.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No gift codes yet</td></tr>
              ) : (
                codes.map((gc) => (
                  <tr key={gc.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-white tracking-wider">{gc.code}</span>
                        <button onClick={() => handleCopy(gc.code)} className="text-muted-foreground hover:text-white transition-colors">
                          {copied === gc.code ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">${Number(gc.reward_amount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{gc.uses_count} / {gc.max_uses}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(gc.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {gc.is_active ? (
                        <span className="text-xs text-green-400">Active</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteId(gc.id)}
                        className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 rounded px-3 py-1.5 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm w-full">
            <h3 className="font-semibold text-white mb-2">Delete Gift Code?</h3>
            <p className="text-sm text-muted-foreground mb-5">This code will be permanently removed and can no longer be redeemed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 text-sm border border-border rounded text-muted-foreground hover:text-white transition-colors">Cancel</button>
              <button onClick={() => deleteGiftCode.mutate({ id: deleteId })} disabled={deleteGiftCode.isPending}
                className="flex-1 py-2.5 text-sm bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded transition-colors">
                {deleteGiftCode.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
