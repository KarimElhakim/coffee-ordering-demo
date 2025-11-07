import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase, getOrders } from '@coffee-demo/api-client';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@coffee-demo/ui';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import type { Database } from '@coffee-demo/api-client';

// Poll for updates in demo mode
let pollInterval: NodeJS.Timeout | null = null;

type Order = Database['public']['Tables']['orders']['Row'] & {
  items: Array<{
    id: string;
    qty: number;
    price_each: number;
    note: string | null;
    menu_item: { name: string };
    options: Array<{ key: string; value: string; price_delta: number }>;
  }>;
};

export function OrderStatus() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const success = searchParams.get('success') === 'true';

  useEffect(() => {
    if (!orderId) return;

    async function loadOrder() {
      try {
        const orders = await getOrders();
        const found = orders.find((o) => o.id === orderId) as Order | undefined;
        if (found) {
          setOrder(found);
        }
      } catch (error) {
        console.error('Failed to load order:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();

    // Subscribe to order updates (or poll in demo mode)
    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        async () => {
          const orders = await getOrders();
          const updated = orders.find((o) => o.id === orderId) as Order | undefined;
          if (updated) setOrder(updated);
        }
      )
      .subscribe();

    // Poll for updates in demo mode (every 2 seconds)
    pollInterval = setInterval(async () => {
      const orders = await getOrders();
      const updated = orders.find((o) => o.id === orderId) as Order | undefined;
      if (updated) setOrder(updated);
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [orderId]);

  if (loading) {
    return <div className="text-center py-12">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Order not found</h2>
        <Button onClick={() => window.location.href = '/'}>Back to Menu</Button>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (order.status) {
      case 'paid':
      case 'in_prep':
      case 'ready':
        return <Clock className="h-8 w-8 text-yellow-500" />;
      case 'served':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Clock className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (order.status) {
      case 'new':
        return 'Order Placed';
      case 'paid':
        return 'Payment Received';
      case 'in_prep':
        return 'Preparing';
      case 'ready':
        return 'Ready for Pickup';
      case 'served':
        return 'Served';
      case 'cancelled':
        return 'Cancelled';
      default:
        return order.status;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {success && (
        <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div>
                <h3 className="font-semibold">Payment Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  Your order has been received and is being prepared.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-semibold">{getStatusText()}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="border-b pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{item.menu_item.name}</h4>
                    {item.options.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {item.options.map((opt) => (
                          <div key={`${opt.key}-${opt.value}`}>
                            {opt.key}: {opt.value}
                          </div>
                        ))}
                      </div>
                    )}
                    {item.note && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        Note: {item.note}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">Qty: {item.qty}</div>
                    <div className="text-sm text-muted-foreground">
                      {(item.price_each * item.qty).toFixed(2)} EGP
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold">{order.total_amount.toFixed(2)} EGP</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

