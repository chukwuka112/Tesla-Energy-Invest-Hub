import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Car, 
  Gift, 
  Megaphone, 
  ShieldAlert,
  LogOut,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function AdminLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card flex flex-col">
        <div className="flex h-16 items-center border-b border-border px-6 gap-3 flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white">
            <span className="font-display font-bold text-sm">T</span>
          </div>
          <div>
            <div className="font-display text-sm font-bold tracking-widest text-white">TESLA</div>
            <div className="text-[10px] tracking-widest text-muted-foreground uppercase">Admin Panel</div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <SectionLabel>Overview</SectionLabel>
          <NavItem href="/" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" active={location === "/"} />
          
          <SectionLabel>Management</SectionLabel>
          <NavItem href="/users" icon={<Users className="h-4 w-4" />} label="Users" active={location.startsWith("/users")} />
          <NavItem href="/deposits" icon={<ArrowDownToLine className="h-4 w-4" />} label="Deposits" active={location.startsWith("/deposits")} />
          <NavItem href="/withdrawals" icon={<ArrowUpFromLine className="h-4 w-4" />} label="Withdrawals" active={location.startsWith("/withdrawals")} />
          
          <SectionLabel>Configuration</SectionLabel>
          <NavItem href="/plans" icon={<Car className="h-4 w-4" />} label="Investment Plans" active={location.startsWith("/plans")} />
          <NavItem href="/gift-codes" icon={<Gift className="h-4 w-4" />} label="Gift Codes" active={location.startsWith("/gift-codes")} />
          <NavItem href="/announcements" icon={<Megaphone className="h-4 w-4" />} label="Announcements" active={location.startsWith("/announcements")} />
          
          <SectionLabel>Security</SectionLabel>
          <NavItem href="/audit-logs" icon={<ShieldAlert className="h-4 w-4" />} label="Audit Logs" active={location.startsWith("/audit-logs")} />
        </nav>

        <div className="border-t border-border p-4 flex-shrink-0">
          <div className="mb-3 px-2">
            <div className="text-xs text-white font-medium">{user?.email}</div>
            <div className="text-[10px] text-muted-foreground capitalize">{user?.role?.replace("_", " ")}</div>
          </div>
          <button 
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 min-h-screen">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-8 backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Admin</span>
            {title && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="text-white font-medium">{title}</span>
              </>
            )}
          </div>
          <a href="/" className="text-sm text-muted-foreground hover:text-white transition-colors">
            ← Back to App
          </a>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 mt-4 px-2 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase first:mt-0">
      {children}
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors ${
        active 
          ? "bg-primary/15 text-primary border border-primary/20" 
          : "text-muted-foreground hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
