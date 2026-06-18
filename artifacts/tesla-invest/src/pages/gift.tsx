import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRedeemGiftCode, useGetDashboard, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Gift as GiftIcon, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const giftSchema = z.object({
  code: z.string().min(5, "Invalid code format").toUpperCase(),
});

type GiftFormValues = z.infer<typeof giftSchema>;

export default function Gift() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [redeemHistory, setRedeemHistory] = useState<any[]>([]);

  const form = useForm<GiftFormValues>({
    resolver: zodResolver(giftSchema),
    defaultValues: { code: "" },
  });

  const redeemCode = useRedeemGiftCode();

  const onSubmit = (data: GiftFormValues) => {
    redeemCode.mutate(
      { data },
      {
        onSuccess: (res) => {
          toast({
            title: "Success!",
            description: `You've received $${res.reward_amount.toFixed(2)}! Your account has been credited.`,
          });
          form.reset();
          setRedeemHistory([...redeemHistory, res]);
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        },
        onError: (err: any) => {
          toast({
            title: "Redemption Failed",
            description: err?.data?.error || "Invalid or expired gift code",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <MobileLayout title="REWARDS">
      <div className="p-4 space-y-6">
        <button 
          onClick={() => setLocation("/")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <GiftIcon className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold uppercase tracking-wider">Redeem Gift Code</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Enter your promotional code to claim account balance rewards.</p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Gift Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="TESLA-XXXXXX" 
                          className="bg-background border-border/50 h-14 text-lg font-mono uppercase focus-visible:ring-primary" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-background/50 border border-border/50 rounded-lg p-4 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Enter a valid gift code to receive bonus credits to your account. Each code can only be used once.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 font-display font-bold tracking-wider text-lg bg-primary hover:bg-primary/90 text-white transition-all"
                  disabled={redeemCode.isPending || !form.watch("code")}
                >
                  {redeemCode.isPending ? "VERIFYING..." : "REDEEM CODE"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {redeemHistory.length > 0 && (
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Redemption History</h3>
              <div className="space-y-3">
                {redeemHistory.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">{item.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.redeemed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary">+${item.reward_amount}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
