import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetAnnouncements, getGetAnnouncementsQueryKey, useAdminCreateAnnouncement, useAdminDeleteAnnouncement } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const annSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  is_pinned: z.boolean().default(false),
});

type AnnFormValues = z.infer<typeof annSchema>;

export default function AdminAnnouncements() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useGetAnnouncements({
    query: { enabled: !!token, queryKey: getGetAnnouncementsQueryKey() }
  });

  const createAnn = useAdminCreateAnnouncement();
  const deleteAnn = useAdminDeleteAnnouncement();

  const form = useForm<AnnFormValues>({
    resolver: zodResolver(annSchema),
    defaultValues: {
      title: "",
      content: "",
      is_pinned: false,
    }
  });

  const onSubmit = (data: AnnFormValues) => {
    createAnn.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Announcement Created" });
          setOpen(false);
          form.reset();
          queryClient.invalidateQueries({ queryKey: getGetAnnouncementsQueryKey() });
        }
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this?")) {
      deleteAnn.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Deleted" });
            queryClient.invalidateQueries({ queryKey: getGetAnnouncementsQueryKey() });
          }
        }
      );
    }
  };

  return (
    <AdminLayout title="Announcements">
      <div className="mb-6 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create Announcement</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New Announcement</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="content" render={({ field }) => (
                  <FormItem><FormLabel>Content</FormLabel><FormControl><Textarea className="resize-none h-32" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="is_pinned" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-border rounded-md">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Pin Announcement</FormLabel>
                      <p className="text-[10px] text-muted-foreground">This will show up prominently on the dashboard.</p>
                    </div>
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createAnn.isPending}>Publish</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Title</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Pinned</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : data?.map((a) => (
              <TableRow key={a.id} className="border-border/50">
                <TableCell className="font-bold">{a.title}</TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">{a.content}</TableCell>
                <TableCell>{a.is_pinned ? 'Yes' : 'No'}</TableCell>
                <TableCell>{format(new Date(a.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(a.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
