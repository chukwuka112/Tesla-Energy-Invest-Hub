import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useResetPassword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const resetSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const email = sessionStorage.getItem("reset_email");

  useEffect(() => {
    if (!email) {
      setLocation("/forgot-password");
    }
  }, [email, setLocation]);

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      otp: "",
      new_password: "",
    },
  });

  const resetPassword = useResetPassword();

  const onSubmit = (data: ResetFormValues) => {
    if (!email) return;
    
    resetPassword.mutate(
      { data: { email, otp: data.otp, new_password: data.new_password } },
      {
        onSuccess: () => {
          sessionStorage.removeItem("reset_email");
          toast({
            title: "Password Reset",
            description: "Your password has been successfully reset. Please log in.",
          });
          setLocation("/login");
        },
        onError: (err: any) => {
          toast({
            title: "Reset Failed",
            description: err?.data?.error || "Could not reset password",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (!email) return null;

  return (
    <div className="flex min-h-screen max-w-[430px] mx-auto flex-col bg-background px-6 py-8">
      <button 
        onClick={() => setLocation("/forgot-password")}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-white mb-8"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-wider text-white mb-3">NEW<br/>PASSWORD</h1>
        <p className="text-sm text-muted-foreground">
          Enter the reset code sent to your email and choose a new password.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">6-Digit Reset Code</FormLabel>
                <FormControl>
                  <Input placeholder="123456" className="bg-card/50 border-border/50 h-12 focus-visible:ring-primary/50 font-display tracking-widest text-center text-xl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="new_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">New Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" className="bg-card/50 border-border/50 h-12 focus-visible:ring-primary/50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full h-12 mt-6 font-display font-bold tracking-wider text-md bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(204,0,0,0.3)] transition-all"
            disabled={resetPassword.isPending}
          >
            {resetPassword.isPending ? "UPDATING..." : "UPDATE PASSWORD"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
