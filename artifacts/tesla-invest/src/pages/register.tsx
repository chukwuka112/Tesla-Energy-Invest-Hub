import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  referral_code: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      referral_code: "",
    },
  });

  const register = useRegister();

  const onSubmit = (data: RegisterFormValues) => {
    register.mutate(
      { data },
      {
        onSuccess: () => {
          toast({
            title: "Registration Initiated",
            description: "Please check your email for the verification code.",
          });
          // Store email in session storage just for the verification step
          sessionStorage.setItem("verify_email", data.email);
          setLocation("/verify-otp");
        },
        onError: (err: any) => {
          toast({
            title: "Registration Failed",
            description: err?.data?.error || "Could not register account",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen max-w-[430px] mx-auto flex-col bg-background relative overflow-hidden">
      {/* Abstract Tech Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[140%] h-[60%] rounded-full bg-primary/20 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center px-8 py-12">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_30px_rgba(204,0,0,0.5)]">
            <span className="font-display text-4xl font-bold">T</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-wider text-white">TESLA INVEST</h1>
          <p className="mt-2 text-sm text-muted-foreground uppercase tracking-widest">Create Portfolio</p>
        </div>

        <div className="mb-8 flex rounded-md bg-card/50 p-1 backdrop-blur-sm border border-border">
          <Link href="/login" className="flex-1 py-2 text-center text-sm font-medium text-muted-foreground transition-colors hover:text-white">
            SIGN IN
          </Link>
          <Link href="/register" className="flex-1 rounded bg-background py-2 text-center text-sm font-medium shadow-sm">
            REGISTER
          </Link>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" className="bg-card/50 border-border/50 h-11 focus-visible:ring-primary/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email" className="bg-card/50 border-border/50 h-11 focus-visible:ring-primary/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" className="bg-card/50 border-border/50 h-11 focus-visible:ring-primary/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referral_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Referral Code (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g. TESLA123" className="bg-card/50 border-border/50 h-11 focus-visible:ring-primary/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full h-12 mt-6 font-display font-bold tracking-wider text-md bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(204,0,0,0.3)] transition-all"
              disabled={register.isPending}
            >
              {register.isPending ? "PROCESSING..." : "CREATE PORTFOLIO"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
