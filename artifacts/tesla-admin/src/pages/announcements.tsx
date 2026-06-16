import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useGetAnnouncements, useAdminCreateAnnouncement, useAdminDeleteAnnouncement, getGetAnnouncementsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Megaphone } from "lucide-react";

export default function Announcements() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: announcements, isLoading } = useGetAnnouncements();

  const create = useAdminCreateAnnouncement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAnnouncementsQueryKey() });
        setShowForm(false);
        setTitle("");
        setContent("");
        setIsPinned(false);
      }
    }
  });

  const remove = useAdminDeleteAnnouncement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAnnouncementsQueryKey() });
        setDeleteId(null);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({ data: { title, content, is_pinned: isPinned } });
  };

  const anns = Array.isArray(announcements) ? announcements : [];

  return (
    <AdminLayout title="Announcements">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Announcements</h2>
            <p className="text-muted-foreground text-sm mt-1">Broadcast messages to all users</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2.5 rounded transition-colors"
          >
            <Plus className="h-4 w-4" /> New Announcement
          </button>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-white mb-5">Create Announcement</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required
                  className="w-full bg-background border border-border rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60 transition-colors"
                  placeholder="Announcement title" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Content</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} required rows={3}
                  className="w-full bg-background border border-border rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60 transition-colors resize-none"
                  placeholder="Write your announcement..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pinned" checked={isPinned} onChange={e => setIsPinned(e.target.checked)}
                  className="rounded border-border" />
                <label htmlFor="pinned" className="text-sm text-muted-foreground cursor-pointer">Pin this announcement</label>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setShowForm(false); setTitle(""); setContent(""); }}
                  className="px-4 py-2.5 text-sm border border-border rounded text-muted-foreground hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={create.isPending}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded transition-colors">
                  <Megaphone className="h-4 w-4" /> {create.isPending ? "Publishing..." : "Publish"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-card border border-border rounded-lg animate-pulse" />
            ))
          ) : anns.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center text-muted-foreground">
              No announcements yet. Create one to notify all users.
            </div>
          ) : (
            anns.map((ann) => (
              <div key={ann.id} className={`bg-card border rounded-lg p-5 flex items-start gap-4 ${ann.is_pinned ? "border-primary/30" : "border-border"}`}>
                <div className={`mt-0.5 p-2 rounded border ${ann.is_pinned ? "text-primary bg-primary/10 border-primary/20" : "text-blue-400 bg-blue-400/10 border-blue-400/20"}`}>
                  <Megaphone className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white text-sm">{ann.title}</h3>
                        {ann.is_pinned && (
                          <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 rounded px-1.5 py-0.5">PINNED</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{ann.content}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => setDeleteId(ann.id)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm w-full">
            <h3 className="font-semibold text-white mb-2">Delete Announcement?</h3>
            <p className="text-sm text-muted-foreground mb-5">This will permanently remove the announcement for all users.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 text-sm border border-border rounded text-muted-foreground hover:text-white transition-colors">Cancel</button>
              <button onClick={() => remove.mutate({ id: deleteId })} disabled={remove.isPending}
                className="flex-1 py-2.5 text-sm bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded transition-colors">
                {remove.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
