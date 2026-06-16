import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Users from "@/pages/users";
import Deposits from "@/pages/deposits";
import Withdrawals from "@/pages/withdrawals";
import Plans from "@/pages/plans";
import GiftCodes from "@/pages/gift-codes";
import Announcements from "@/pages/announcements";
import AuditLogs from "@/pages/audit-logs";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  }
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, token, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && (!token || (user && !isAdmin))) {
      setLocation("/login");
    }
  }, [user, isLoading, token, isAdmin, setLocation]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!token || !user || !isAdmin) return null;

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/users" component={() => <ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/deposits" component={() => <ProtectedRoute><Deposits /></ProtectedRoute>} />
      <Route path="/withdrawals" component={() => <ProtectedRoute><Withdrawals /></ProtectedRoute>} />
      <Route path="/plans" component={() => <ProtectedRoute><Plans /></ProtectedRoute>} />
      <Route path="/gift-codes" component={() => <ProtectedRoute><GiftCodes /></ProtectedRoute>} />
      <Route path="/announcements" component={() => <ProtectedRoute><Announcements /></ProtectedRoute>} />
      <Route path="/audit-logs" component={() => <ProtectedRoute><AuditLogs /></ProtectedRoute>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
