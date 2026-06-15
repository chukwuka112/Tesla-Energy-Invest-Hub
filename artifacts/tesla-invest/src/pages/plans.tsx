import { Link, useLocation } from "wouter";
import { useGetPlans, getGetPlansQueryKey } from "@workspace/api-client-react";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, ShieldCheck, Battery } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Plans() {
  const [, setLocation] = useLocation();
  const { token } = useAuth();
  
  const { data: plans, isLoading } = useGetPlans({
    query: { enabled: !!token, queryKey: getGetPlansQueryKey() }
  });

  const activePlans = plans?.filter(p => p.status === 'active') || [];

  return (
    <MobileLayout title="PORTFOLIO PLANS">
      <div className="p-4 space-y-6">
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">
            Select a high-yield investment vehicle powered by advanced market arbitrage algorithms.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[280px] w-full rounded-xl" />
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {activePlans.map((plan) => (
              <Card key={plan.id} className="overflow-hidden border-border bg-card shadow-lg relative group">
                {/* Image Section */}
                <div className="relative h-48 w-full bg-black">
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10" />
                  <img 
                    src={plan.image_url || "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=1000"} 
                    alt={plan.name}
                    className="h-full w-full object-cover opacity-80 mix-blend-luminosity group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute bottom-4 left-4 z-20">
                    <h3 className="font-display text-2xl font-bold tracking-wider text-white uppercase">{plan.name}</h3>
                    {plan.model_name && (
                      <p className="text-xs font-medium text-primary uppercase tracking-widest">{plan.model_name}</p>
                    )}
                  </div>
                </div>

                <CardContent className="p-5 pt-4">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="flex flex-col items-center justify-center p-2 rounded bg-background border border-border/50">
                      <Zap className="h-4 w-4 text-accent mb-1" />
                      <p className="font-display text-sm font-bold">{plan.roi_percentage}%</p>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Daily ROI</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded bg-background border border-border/50">
                      <Battery className="h-4 w-4 text-green-500 mb-1" />
                      <p className="font-display text-sm font-bold">{plan.duration_days}</p>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Days</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded bg-background border border-border/50">
                      <ShieldCheck className="h-4 w-4 text-primary mb-1" />
                      <p className="font-display text-xs font-bold">${plan.min_amount}</p>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Min Entry</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6 text-sm">
                    <span className="text-muted-foreground">Range</span>
                    <span className="font-display font-medium">
                      ${plan.min_amount} - ${plan.max_amount}
                    </span>
                  </div>

                  <Button 
                    onClick={() => setLocation(`/invest/${plan.id}`)}
                    className="w-full font-display uppercase tracking-widest bg-white text-black hover:bg-white/90"
                  >
                    SELECT VEHICLE
                  </Button>
                </CardContent>
              </Card>
            ))}

            {activePlans.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No investment plans currently available.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
