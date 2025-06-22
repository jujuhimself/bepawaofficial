import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { orderService, Order } from '../services/orderService';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import { FileText } from 'lucide-react';

const useOrdersData = (pharmacyId?: string) => {
    return useQuery({
        queryKey: ['retailOrders', pharmacyId],
        queryFn: async () => {
            if (!pharmacyId) throw new Error("Pharmacy ID not available.");
            return orderService.getOrdersByPharmacy(pharmacyId);
        },
        enabled: !!pharmacyId,
    });
};

export default function Orders() {
    const { user } = useAuth();
    const { data: orders, isLoading, isError, error } = useOrdersData(user?.pharmacyId);

    if (isLoading) {
        return <LoadingState text="Loading Orders..." />;
    }

    if (isError) {
        return <EmptyState title="Failed to Load Orders" description={error instanceof Error ? error.message : 'An unknown error occurred.'} icon={<FileText />} />;
    }

    return (
        <div className="container mx-auto p-4">
            <PageHeader title="Retail Orders" />
            <Card>
                <CardHeader>
                    <CardTitle>Your Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders && orders.length > 0 ? (
                                orders.map((order: Order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono">{order.id.substring(0, 8)}</TableCell>
                                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>{order.customer_name || 'N/A'}</TableCell>
                                        <TableCell><Badge>{order.status}</Badge></TableCell>
                                        <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        You have no orders yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}