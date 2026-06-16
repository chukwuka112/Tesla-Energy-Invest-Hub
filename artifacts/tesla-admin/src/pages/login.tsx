import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();

  const login = useLogin({
    mutation: {
      onSuccess: (data) => {
        if (data.token) {
          setToken(data.token);
          setLocation("/");
        }
      },
      onError: () => {
        setError("Invalid credentials or insufficient privileges");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    login.mutate({ data: { email, password } });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 mb-4">
            <span className="font-display text-2xl font-bold text-primary">T</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wider text-white">ADMIN ACCESS</h1>
          <p className="text-muted-foreground text-sm mt-1">Authorized personnel only</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@teslainvest.io"
                required
                className="w-full bg-background border border-border rounded px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-background border border-border rounded px-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded transition-colors"
            >
              {login.isPending ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Tesla Invest Admin Panel · Restricted Access
        </p>
      </div>
    </div>
  );
}
