import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAdminGetPlans, getAdminGetPlansQueryKey, useAdminCreatePlan, useAdminUpdatePlan, useAdminDeletePlan } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const planSchema = z.object({
  name: z.string().min(1, "Name is required"),
  model_name: z.string().optional(),
  image_url: z.string().url("Valid URL required"),
  min_amount: z.coerce.number().min(1),
  max_amount: z.coerce.number().min(1),
  roi_percentage: z.coerce.number().min(0.1),
  duration_days: z.coerce.number().min(1),
  display_order: z.coerce.number().default(0),
});

type PlanFormValues = z.infer<typeof planSchema>;

export default function AdminPlans() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useAdminGetPlans({
    query: { enabled: !!token, queryKey: getAdminGetPlansQueryKey() }
  });

  const createPlan = useAdminCreatePlan();
  const deletePlan = useAdminDeletePlan();

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      model_name: "",
      image_url: "",
      min_amount: 100,
      max_amount: 1000,
      roi_percentage: 1.5,
      duration_days: 30,
      display_order: 0,
    }
  });

  const onSubmit = (data: PlanFormValues) => {
    createPlan.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Plan Created" });
          setOpen(false);
          form.reset();
          queryClient.invalidateQueries({ queryKey: getAdminGetPlansQueryKey() });
        }
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this plan?")) {
      deletePlan.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Plan Deleted" });
            queryClient.invalidateQueries({ queryKey: getAdminGetPlansQueryKey() });
          }
        }
      );
    }
  };

  return (
    <AdminLayout title="Investment Plans">
      <div className="mb-6 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create Plan</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Plan</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="model_name" render={({ field }) => (
                  <FormItem><FormLabel>Model Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="image_url" render={({ field }) => (
                  <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="min_amount" render={({ field }) => (
                    <FormItem><FormLabel>Min Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="max_amount" render={({ field }) => (
                    <FormItem><FormLabel>Max Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="roi_percentage" render={({ field }) => (
                    <FormItem><FormLabel>Daily ROI %</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="duration_days" render={({ field }) => (
                    <FormItem><FormLabel>Duration (Days)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full" disabled={createPlan.isPending}>Save Plan</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Range</TableHead>
              <TableHead>ROI / Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : data?.map((p) => (
              <TableRow key={p.id} className="border-border/50">
                <TableCell className="font-bold">{p.name}</TableCell>
                <TableCell>{p.model_name}</TableCell>
                <TableCell>${p.min_amount} - ${p.max_amount}</TableCell>
                <TableCell>{p.roi_percentage}% / {p.duration_days}d</TableCell>
                <TableCell>{p.status}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
