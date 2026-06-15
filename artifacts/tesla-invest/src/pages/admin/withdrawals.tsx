import { useState } from "react";
import { useAdminGetWithdrawals, getAdminGetWithdrawalsQueryKey, useAdminApproveWithdrawal, useAdminRejectWithdrawal } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function AdminWithdrawals() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("pending");

  const { data, isLoading } = useAdminGetWithdrawals({ status, page: 1 }, {
    query: { enabled: !!token, queryKey: getAdminGetWithdrawalsQueryKey({ status, page: 1 }) }
  });

  const approve = useAdminApproveWithdrawal();
  const reject = useAdminRejectWithdrawal();

  const handleApprove = (id: string) => {
    approve.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Withdrawal Approved" });
        queryClient.invalidateQueries({ queryKey: getAdminGetWithdrawalsQueryKey({ status, page: 1 }) });
      }
    });
  };

  const handleReject = (id: string) => {
    reject.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Withdrawal Rejected" });
        queryClient.invalidateQueries({ queryKey: getAdminGetWithdrawalsQueryKey({ status, page: 1 }) });
      }
    });
  };

  return (
    <AdminLayout title="Withdrawals">
      <div className="mb-6">
        <Tabs value={status} onValueChange={setStatus}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>User ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Wallet Address</TableHead>
              <TableHead>Network</TableHead>
              <TableHead>Date</TableHead>
              {status === 'pending' && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : data?.map((w) => (
              <TableRow key={w.id} className="border-border/50">
                <TableCell className="font-mono text-xs text-muted-foreground">{w.user_id}</TableCell>
                <TableCell className="font-bold">${w.amount.toFixed(2)}</TableCell>
                <TableCell className="font-mono text-xs">{w.wallet_address}</TableCell>
                <TableCell>{w.network}</TableCell>
                <TableCell>{format(new Date(w.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                {status === 'pending' && (
                  <TableCell className="text-right space-x-2">
                    <Button variant="default" size="sm" onClick={() => handleApprove(w.id)} disabled={approve.isPending || reject.isPending}>Approve</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleReject(w.id)} disabled={approve.isPending || reject.isPending}>Reject</Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {data?.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No withdrawals found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
