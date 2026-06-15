import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForgotPassword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPassword = useForgotPassword();

  const onSubmit = (data: ForgotFormValues) => {
    forgotPassword.mutate(
      { data },
      {
        onSuccess: () => {
          toast({
            title: "Reset Code Sent",
            description: "Please check your email for the reset code.",
          });
          sessionStorage.setItem("reset_email", data.email);
          setLocation("/reset-password");
        },
        onError: (err: any) => {
          toast({
            title: "Request Failed",
            description: err?.data?.error || "Could not process request",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen max-w-[430px] mx-auto flex-col bg-background px-6 py-8">
      <button 
        onClick={() => setLocation("/login")}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-white mb-8"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-wider text-white mb-3">RECOVER<br/>ACCESS</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we'll send you a code to reset your password.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Registered Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your email" className="bg-card/50 border-border/50 h-12 focus-visible:ring-primary/50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full h-12 font-display font-bold tracking-wider text-md bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(204,0,0,0.3)] transition-all"
            disabled={forgotPassword.isPending}
          >
            {forgotPassword.isPending ? "PROCESSING..." : "SEND RESET CODE"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
