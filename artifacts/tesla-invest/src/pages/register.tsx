import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SECURITY_QUESTIONS = [
  "What is your favorite fruit?",
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your favorite food?",
  "What was your childhood nickname?",
  "What is your favorite color?",
  "What is your mother's first name?",
  "What was the name of your first school?",
  "What is your dream car brand?",
  "What is your favorite sports team?",
];

const registerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  security_question_1: z.string().min(1, "Please select a security question"),
  security_answer_1: z.string().min(2, "Answer must be at least 2 characters"),
  security_question_2: z.string().min(1, "Please select a second security question"),
  security_answer_2: z.string().min(2, "Answer must be at least 2 characters"),
  referral_code: z.string().optional(),
}).refine(
  (data) => data.security_question_1 !== data.security_question_2,
  {
    message: "Please select two different security questions",
    path: ["security_question_2"],
  }
);

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
      security_question_1: "",
      security_answer_1: "",
      security_question_2: "",
      security_answer_2: "",
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
            title: "Registration Successful",
            description: "Your account has been created. You can now log in.",
          });
          setLocation("/login");
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

      <div className="relative z-10 flex flex-1 flex-col justify-center px-8 py-12 overflow-y-auto">
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

            <div className="border-t border-border/50 pt-4 mt-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4 font-semibold">Security Questions</p>
              
              <FormField
                control={form.control}
                name="security_question_1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Question 1</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-card/50 border-border/50 h-11">
                          <SelectValue placeholder="Select a security question" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SECURITY_QUESTIONS.map((question) => (
                          <SelectItem key={question} value={question}>
                            {question}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="security_answer_1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Answer 1</FormLabel>
                    <FormControl>
                      <Input placeholder="Your answer" className="bg-card/50 border-border/50 h-11 focus-visible:ring-primary/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="security_question_2"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Question 2</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-card/50 border-border/50 h-11">
                          <SelectValue placeholder="Select a different security question" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SECURITY_QUESTIONS.map((question) => (
                          <SelectItem key={question} value={question}>
                            {question}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="security_answer_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Answer 2</FormLabel>
                    <FormControl>
                      <Input placeholder="Your answer" className="bg-card/50 border-border/50 h-11 focus-visible:ring-primary/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
