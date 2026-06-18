import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateWithdrawal, useGetDashboard, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Wallet, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const WITHDRAWAL_FEE_PERCENT = 4;

export default function Withdraw() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { token } = useAuth();

  const { data: dashboard } = useGetDashboard({
    query: { enabled: !!token, queryKey: getGetDashboardQueryKey() }
  });

  const balance = dashboard?.balance || 0;

  const withdrawSchema = z.object({
    amount: z.coerce.number()
      .min(1, "Minimum withdrawal is $1")
      .max(balance, "Insufficient balance"),
    wallet_address: z.string().min(10, "Invalid wallet address"),
    network: z.string().min(1, "Please select a network"),
  });

  type WithdrawFormValues = z.infer<typeof withdrawSchema>;

  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      amount: 0,
      wallet_address: "",
      network: "USDT_TRC20",
    },
  });

  const createWithdrawal = useCreateWithdrawal();
  const amount = form.watch("amount");
  const fee = amount * (WITHDRAWAL_FEE_PERCENT / 100);
  const finalAmount = amount - fee;

  const onSubmit = (data: WithdrawFormValues) => {
    if (finalAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Withdrawal amount must be greater than the processing fee",
        variant: "destructive",
      });
      return;
    }

    createWithdrawal.mutate(
      { 
        data: {
          ...data,
          processing_fee: fee,
          final_amount: finalAmount,
        }
      },
      {
        onSuccess: () => {
          toast({
            title: "Withdrawal Requested",
            description: "Your withdrawal request is pending approval.",
          });
          setLocation("/transactions");
        },
        onError: (err: any) => {
          toast({
            title: "Request Failed",
            description: err?.data?.error || "Could not process withdrawal",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <MobileLayout title="WITHDRAW">
      <div className="p-4 space-y-6">
        <button 
          onClick={() => setLocation("/")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Available to Withdraw</span>
              </div>
              <span className="font-display font-bold text-xl">${balance.toFixed(2)}</span>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Amount (USD)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-lg text-muted-foreground">$</span>
                          <Input 
                            type="number" 
                            className="bg-background border-border/50 h-14 pl-8 text-lg font-display focus-visible:ring-primary" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="network"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Network</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border/50 h-14">
                            <SelectValue placeholder="Select network" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USDT_TRC20">USDT (TRC20)</SelectItem>
                          <SelectItem value="USDT_ERC20">USDT (ERC20)</SelectItem>
                          <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wallet_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Destination Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter wallet address" 
                          className="bg-background border-border/50 h-14 font-mono text-sm" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fee Information */}
                <div className="bg-background/50 border border-border/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Note: A {WITHDRAWAL_FEE_PERCENT}% withdrawal processing fee will be deducted from every withdrawal request.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Withdrawal Amount:</span>
                      <span className="font-medium">${amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{WITHDRAWAL_FEE_PERCENT}% Processing Fee:</span>
                      <span className="font-medium text-red-500">-${fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border/50">
                      <span>Amount You'll Receive:</span>
                      <span className="text-primary">${finalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 mt-4 font-display font-bold tracking-wider text-lg bg-primary hover:bg-primary/90 text-white transition-all"
                  disabled={createWithdrawal.isPending || balance < 1 || amount <= 0}
                >
                  {createWithdrawal.isPending ? "PROCESSING..." : "SUBMIT REQUEST"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}
