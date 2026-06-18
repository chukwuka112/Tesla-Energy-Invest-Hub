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

const securitySchema = z.object({
  answer_1: z.string().min(1, "Please provide an answer"),
  answer_2: z.string().min(1, "Please provide an answer"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;
type SecurityFormValues = z.infer<typeof securitySchema>;

interface SecurityQuestion {
  question: string;
  id: string;
}

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "security">("email");
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>([]);
  const [userEmail, setUserEmail] = useState("");
  
  const emailForm = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
  });

  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      answer_1: "",
      answer_2: "",
    },
  });

  const forgotPassword = useForgotPassword();

  const onEmailSubmit = (data: ForgotFormValues) => {
    forgotPassword.mutate(
      { data },
      {
        onSuccess: (response: any) => {
          setUserEmail(data.email);
          setSecurityQuestions(response.questions || []);
          setStep("security");
          toast({
            title: "Security Questions",
            description: "Please answer your security questions to proceed.",
          });
        },
        onError: (err: any) => {
          toast({
            title: "Request Failed",
            description: err?.data?.error || "Email not found or could not process request",
            variant: "destructive",
          });
        },
      }
    );
  };

  const onSecuritySubmit = (data: SecurityFormValues) => {
    // Send security question answers to verify
    forgotPassword.mutate(
      { 
        data: {
          email: userEmail,
          security_answers: {
            answer_1: data.answer_1,
            answer_2: data.answer_2,
          }
        }
      },
      {
        onSuccess: () => {
          toast({
            title: "Verification Successful",
            description: "You can now reset your password.",
          });
          sessionStorage.setItem("reset_email", userEmail);
          setLocation("/reset-password");
        },
        onError: (err: any) => {
          toast({
            title: "Verification Failed",
            description: err?.data?.error || "Incorrect answers to security questions",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen max-w-[430px] mx-auto flex-col bg-background px-6 py-8">
      <button 
        onClick={() => {
          if (step === "security") {
            setStep("email");
            securityForm.reset();
          } else {
            setLocation("/login");
          }
        }}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-white mb-8"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      {step === "email" ? (
        <>
          <div className="mb-10">
            <h1 className="font-display text-3xl font-bold tracking-wider text-white mb-3">RECOVER<br/>ACCESS</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email address to proceed with password recovery.
            </p>
          </div>

          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
              <FormField
                control={emailForm.control}
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
                {forgotPassword.isPending ? "VERIFYING..." : "CONTINUE"}
              </Button>
            </form>
          </Form>
        </>
      ) : (
        <>
          <div className="mb-10">
            <h1 className="font-display text-3xl font-bold tracking-wider text-white mb-3">VERIFY<br/>IDENTITY</h1>
            <p className="text-sm text-muted-foreground">
              Please answer your security questions to verify your identity.
            </p>
          </div>

          <Form {...securityForm}>
            <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
              {securityQuestions.length >= 2 && (
                <>
                  <FormField
                    control={securityForm.control}
                    name="answer_1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                          {securityQuestions[0]?.question}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Your answer" className="bg-card/50 border-border/50 h-12 focus-visible:ring-primary/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={securityForm.control}
                    name="answer_2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                          {securityQuestions[1]?.question}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Your answer" className="bg-card/50 border-border/50 h-12 focus-visible:ring-primary/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 font-display font-bold tracking-wider text-md bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(204,0,0,0.3)] transition-all"
                disabled={forgotPassword.isPending}
              >
                {forgotPassword.isPending ? "VERIFYING..." : "VERIFY & CONTINUE"}
              </Button>
            </form>
          </Form>
        </>
      )}
    </div>
  );
}
