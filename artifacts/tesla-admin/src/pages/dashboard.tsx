import { AdminLayout } from "@/components/layout/admin-layout";
import { useAdminGetAnalytics, useAdminGetDeposits, useAdminGetWithdrawals, getAdminGetDepositsQueryKey, getAdminGetWithdrawalsQueryKey } from "@workspace/api-client-react";
import { Users, DollarSign, ArrowDownToLine, ArrowUpFromLine, TrendingUp, Clock } from "lucide-react";

export default function Dashboard() {
  const { data: analytics, isLoading } = useAdminGetAnalytics();
  const { data: pendingDepositsData } = useAdminGetDeposits(
    { status: "pending", page: 1 },
    { query: { queryKey: getAdminGetDepositsQueryKey({ status: "pending", page: 1 }) } }
  );
  const { data: pendingWithdrawalsData } = useAdminGetWithdrawals(
    { status: "pending", page: 1 },
    { query: { queryKey: getAdminGetWithdrawalsQueryKey({ status: "pending", page: 1 }) } }
  );

  const pendingDeposits = Array.isArray(pendingDepositsData) ? pendingDepositsData.length : 0;
  const pendingWithdrawals = Array.isArray(pendingWithdrawalsData) ? pendingWithdrawalsData.length : 0;

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-8">
        <div>
          <h2 className="font-display text-xl font-bold text-white mb-1">Platform Overview</h2>
          <p className="text-muted-foreground text-sm">Real-time metrics for Tesla Invest</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-card border border-border rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                icon={<Users className="h-5 w-5" />}
                label="Total Users"
                value={analytics?.total_users ?? 0}
                sub={`${analytics?.active_users ?? 0} active`}
                color="blue"
              />
              <StatCard
                icon={<DollarSign className="h-5 w-5" />}
                label="Total Deposits"
                value={`$${Number(analytics?.total_deposits ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                sub="All time"
                color="green"
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="Total Investments"
                value={`$${Number(analytics?.total_investments ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                sub="Total value"
                color="gold"
              />
              <StatCard
                icon={<ArrowDownToLine className="h-5 w-5" />}
                label="Pending Deposits"
                value={pendingDeposits}
                sub="Awaiting approval"
                color="red"
                highlight={pendingDeposits > 0}
              />
              <StatCard
                icon={<ArrowUpFromLine className="h-5 w-5" />}
                label="Pending Withdrawals"
                value={pendingWithdrawals}
                sub="Awaiting approval"
                color="red"
                highlight={pendingWithdrawals > 0}
              />
              <StatCard
                icon={<Clock className="h-5 w-5" />}
                label="New Users Today"
                value={analytics?.new_users_today ?? 0}
                sub="Registered today"
                color="blue"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <QuickAction href="/deposits" label="Review Deposits" count={pendingDeposits} />
                  <QuickAction href="/withdrawals" label="Review Withdrawals" count={pendingWithdrawals} />
                  <QuickAction href="/users" label="Manage Users" />
                  <QuickAction href="/announcements" label="Post Announcement" />
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold text-white mb-4">Today's Activity</h3>
                <div className="space-y-3">
                  <HealthRow label="Deposits Today" value={`$${Number(analytics?.deposits_today ?? 0).toLocaleString()}`} />
                  <HealthRow label="Withdrawals Today" value={`$${Number(analytics?.withdrawals_today ?? 0).toLocaleString()}`} />
                  <HealthRow label="Total Balance" value={`$${Number(analytics?.total_balance ?? 0).toLocaleString()}`} />
                  <HealthRow label="New Users" value={String(analytics?.new_users_today ?? 0)} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon, label, value, sub, color, highlight }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  color: "blue" | "green" | "gold" | "red";
  highlight?: boolean;
}) {
  const colors = {
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    green: "text-green-400 bg-green-400/10 border-green-400/20",
    gold: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    red: "text-primary bg-primary/10 border-primary/20",
  };

  return (
    <div className={`bg-card border rounded-lg p-6 ${highlight ? "border-primary/40" : "border-border"}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded border ${colors[color]}`}>
          {icon}
        </div>
        {highlight && (
          <span className="text-xs bg-primary/20 text-primary border border-primary/30 rounded px-2 py-0.5">
            Action needed
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xs text-muted-foreground mt-1 opacity-70">{sub}</div>
    </div>
  );
}

function QuickAction({ href, label, count }: { href: string; label: string; count?: number }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between bg-background hover:bg-white/5 border border-border rounded px-3 py-3 text-sm text-muted-foreground hover:text-white transition-colors"
    >
      <span>{label}</span>
      {count != null && count > 0 && (
        <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {count}
        </span>
      )}
    </a>
  );
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm text-white font-medium">{value}</span>
    </div>
  );
}
