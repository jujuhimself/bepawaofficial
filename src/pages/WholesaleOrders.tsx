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

const useWholesaleOrdersData = (wholesalerId?: string) => {
    return useQuery({
        queryKey: ['wholesaleOrders', wholesalerId],
        queryFn: async () => {
            if (!wholesalerId) throw new Error("Wholesaler ID not available.");
            return orderService.getOrdersByWholesaler(wholesalerId);
        },
        enabled: !!wholesalerId,
    });
};

export default function WholesaleOrders() {
    const { user } = useAuth();
    const { data: orders, isLoading, isError, error } = useWholesaleOrdersData(user?.id);

    if (isLoading) {
        return <LoadingState text="Loading Wholesale Orders..." />;
    }

    if (isError) {
        return <EmptyState title="Failed to Load Orders" description={error instanceof Error ? error.message : 'An unknown error occurred.'} icon={<FileText />} />;
    }

    return (
        <div className="container mx-auto p-4">
            <PageHeader title="Wholesale Orders" />
            <Card>
                <CardHeader>
                    <CardTitle>Orders from Retailers</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Retailer</TableHead>
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
                                        <TableCell>{(order as any).pharmacyName || 'N/A'}</TableCell>
                                        <TableCell><Badge>{order.status}</Badge></TableCell>
                                        <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        You have no orders from retailers yet.
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