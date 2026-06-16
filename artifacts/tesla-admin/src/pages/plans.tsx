import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useAdminGetPlans, useAdminCreatePlan, useAdminUpdatePlan, useAdminDeletePlan, getAdminGetPlansQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

interface PlanForm {
  name: string;
  min_amount: string;
  max_amount: string;
  roi_percentage: string;
  duration_days: string;
  description: string;
  image_url: string;
}

const emptyForm: PlanForm = { name: "", min_amount: "", max_amount: "", roi_percentage: "", duration_days: "7", description: "", image_url: "" };

export default function Plans() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useAdminGetPlans();

  const createPlan = useAdminCreatePlan({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminGetPlansQueryKey() });
        setShowForm(false);
        setForm(emptyForm);
      }
    }
  });

  const updatePlan = useAdminUpdatePlan({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminGetPlansQueryKey() });
        setEditId(null);
        setForm(emptyForm);
        setShowForm(false);
      }
    }
  });

  const deletePlan = useAdminDeletePlan({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminGetPlansQueryKey() });
        setDeleteId(null);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updatePlan.mutate({ id: editId, data: {
        name: form.name,
        min_amount: Number(form.min_amount),
        max_amount: form.max_amount ? Number(form.max_amount) : undefined,
        roi_percentage: Number(form.roi_percentage),
        duration_days: Number(form.duration_days),
        description: form.description || undefined,
        image_url: form.image_url || undefined,
      }});
    } else {
      createPlan.mutate({ data: {
        name: form.name,
        min_amount: Number(form.min_amount),
        max_amount: Number(form.max_amount || "999999"),
        roi_percentage: Number(form.roi_percentage),
        duration_days: Number(form.duration_days),
        description: form.description || undefined,
        image_url: form.image_url || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
      }});
    }
  };

  const startEdit = (plan: NonNullable<typeof plans>[0]) => {
    setEditId(plan.id);
    setForm({
      name: plan.name,
      min_amount: String(plan.min_amount),
      max_amount: plan.max_amount != null ? String(plan.max_amount) : "",
      roi_percentage: String(plan.roi_percentage),
      duration_days: String(plan.duration_days),
      description: plan.description ?? "",
      image_url: plan.image_url ?? "",
    });
    setShowForm(true);
  };

  return (
    <AdminLayout title="Investment Plans">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Investment Plans</h2>
            <p className="text-muted-foreground text-sm mt-1">Configure available plans for investors</p>
          </div>
          <button
            onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(true); }}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2.5 rounded transition-colors"
          >
            <Plus className="h-4 w-4" /> New Plan
          </button>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">{editId ? "Edit Plan" : "Create New Plan"}</h3>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} className="text-muted-foreground hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Plan Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full bg-background border border-border rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60 transition-colors" placeholder="e.g. Starter" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Duration (days)</label>
                <input type="number" value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: e.target.value }))} required min="1"
                  className="w-full bg-background border border-border rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Min Amount ($)</label>
                <input type="number" value={form.min_amount} onChange={e => setForm(f => ({ ...f, min_amount: e.target.value }))} required min="0" step="0.01"
                  className="w-full bg-background border border-border rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Max Amount ($)</label>
                <input type="number" value={form.max_amount} onChange={e => setForm(f => ({ ...f, max_amount: e.target.value }))} min="0" step="0.01"
                  className="w-full bg-background border border-border rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60 transition-colors" placeholder="Leave blank for unlimited" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">ROI % (total return over duration)</label>
                <input type="number" value={form.roi_percentage} onChange={e => setForm(f => ({ ...f, roi_percentage: e.target.value }))} required min="0" step="0.01"
                  className="w-full bg-background border border-border rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Image URL (optional)</label>
                <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  className="w-full bg-background border border-border rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60 transition-colors" placeholder="https://..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-muted-foreground mb-1.5">Description (optional)</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-background border border-border rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60 transition-colors" placeholder="Short description" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}
                  className="px-4 py-2.5 text-sm border border-border rounded text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createPlan.isPending || updatePlan.isPending}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded transition-colors">
                  <Check className="h-4 w-4" /> {editId ? "Save Changes" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            [...Array(5)].map((_, i) => <div key={i} className="h-48 bg-card border border-border rounded-lg animate-pulse" />)
          ) : (plans ?? []).map((plan) => (
            <div key={plan.id} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white">{plan.name}</h3>
                  {plan.description && <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>}
                </div>
                <span className="text-xl font-display font-bold text-primary">{plan.roi_percentage}%</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min investment</span>
                  <span className="text-white">${Number(plan.min_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max investment</span>
                  <span className="text-white">{plan.max_amount ? `$${Number(plan.max_amount).toLocaleString()}` : "Unlimited"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="text-white">{plan.duration_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={plan.status === "active" ? "text-green-400" : "text-muted-foreground"}>{plan.status}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-5 pt-4 border-t border-border">
                <button onClick={() => startEdit(plan)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground bg-border hover:bg-white/10 rounded px-3 py-2 transition-colors">
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button onClick={() => setDeleteId(plan.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs text-primary bg-primary/10 hover:bg-primary/20 rounded px-3 py-2 transition-colors">
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm w-full">
            <h3 className="font-semibold text-white mb-2">Delete Plan?</h3>
            <p className="text-sm text-muted-foreground mb-5">This will permanently remove the plan. Existing investments won't be affected.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 text-sm border border-border rounded text-muted-foreground hover:text-white transition-colors">Cancel</button>
              <button onClick={() => deletePlan.mutate({ id: deleteId })} disabled={deletePlan.isPending}
                className="flex-1 py-2.5 text-sm bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded transition-colors">
                {deletePlan.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
