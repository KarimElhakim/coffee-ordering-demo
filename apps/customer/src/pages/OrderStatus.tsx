import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, getOrders, getItemImage } from '@coffee-demo/api-client';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@coffee-demo/ui';
import { CheckCircle, Clock, XCircle, ArrowLeft, Coffee, ShoppingBag } from 'lucide-react';
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
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const success = searchParams.get('success') === 'true';

  useEffect(() => {
    if (!orderId) return;

    async function loadOrder() {
      try {
        const orders = await getOrders();
        const found = orders.find((o: any) => o.id === orderId) as Order | undefined;
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
          const updated = orders.find((o: any) => o.id === orderId) as Order | undefined;
          if (updated) setOrder(updated);
        }
      )
      .subscribe();

    // Poll for updates in demo mode (every 2 seconds)
    pollInterval = setInterval(async () => {
      const orders = await getOrders();
      const updated = orders.find((o: any) => o.id === orderId) as Order | undefined;
      if (updated) setOrder(updated);
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        <p className="mt-4 text-amber-700 dark:text-amber-400">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="h-16 w-16 text-amber-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4 text-amber-900 dark:text-amber-100">Order not found</h2>
        <Button 
          onClick={() => navigate('/')}
          className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Menu
        </Button>
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
        <Card className="mb-6 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 shadow-xl animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-full">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-green-700 dark:text-green-400">Payment Successful!</h3>
                <p className="text-sm text-green-700/70 dark:text-green-400/70">
                  Your order has been received and is being prepared.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="border-amber-200 dark:border-amber-800 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <Coffee className="h-6 w-6 text-amber-600" />
              Order {order.order_number || `#${order.id.slice(0, 8)}`}
            </CardTitle>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              {getStatusIcon()}
              <span className="font-semibold text-amber-900 dark:text-amber-100">{getStatusText()}</span>
            </div>
          </div>
          <p className="text-sm text-amber-700/70 dark:text-amber-400/70 mt-2">
            Placed on {new Date(order.created_at).toLocaleString()}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="border border-amber-200 dark:border-amber-800 rounded-lg p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-700 dark:to-slate-800 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex-shrink-0 shadow-lg border-2 border-gray-900 dark:border-white">
                    <img 
                      src={getItemImage(item.menu_item.name, item.menu_item)} 
                      alt={item.menu_item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200/000000/ffffff?text=' + encodeURIComponent(item.menu_item.name.substring(0, 2));
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg text-amber-900 dark:text-amber-100">{item.menu_item.name}</h4>
                        {item.options.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.options.map((opt) => (
                              <span 
                                key={`${opt.key}-${opt.value}`}
                                className="text-xs px-2 py-1 bg-amber-200 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full font-medium"
                              >
                                {opt.key}: {opt.value}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.note && (
                          <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-2 italic border-l-2 border-amber-300 dark:border-amber-700 pl-2">
                            Note: {item.note}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-bold text-amber-900 dark:text-amber-100">x{item.qty}</div>
                        <div className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                          {(item.price_each * item.qty).toFixed(2)} EGP
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="border-t border-amber-200 dark:border-amber-800 pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold text-amber-900 dark:text-amber-100">Total</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-amber-900 dark:from-amber-400 dark:to-amber-600 bg-clip-text text-transparent">
                  {order.total_amount.toFixed(2)} EGP
                </span>
              </div>
            </div>
            <div className="pt-4">
              <Button 
                onClick={() => navigate('/')}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Menu
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

