import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, getOrders, getItemImage } from '@coffee-demo/api-client';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@coffee-demo/ui';
import { CheckCircle, Clock, XCircle, ArrowLeft, Coffee, ShoppingBag, Sparkles } from 'lucide-react';
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
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-black dark:border-white mb-4"></div>
          <p className="text-xl font-bold text-black dark:text-white">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-4 border-black dark:border-white shadow-2xl">
          <CardContent className="pt-16 pb-16 text-center">
            <ShoppingBag className="h-24 w-24 text-black dark:text-white mx-auto mb-6" />
            <h2 className="text-4xl font-black mb-4 text-black dark:text-white">Order not found</h2>
            <Button 
              onClick={() => navigate('/')}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-bold text-lg px-8 py-6 mt-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (order.status) {
      case 'paid':
      case 'in_prep':
      case 'ready':
        return <Clock className="h-6 w-6" />;
      case 'served':
        return <CheckCircle className="h-6 w-6" />;
      case 'cancelled':
        return <XCircle className="h-6 w-6" />;
      default:
        return <Clock className="h-6 w-6" />;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-black dark:via-gray-950 dark:to-black py-8 px-4 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        {success && (
          <Card className="mb-8 border-4 border-black dark:border-white bg-white dark:bg-black shadow-2xl animate-fade-in-down">
            <CardContent className="pt-8 pb-8">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-black dark:bg-white rounded-full animate-bounce">
                  <CheckCircle className="h-10 w-10 text-white dark:text-black" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-3xl text-black dark:text-white mb-2">Payment Successful!</h3>
                  <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">
                    Your order has been received and is being prepared
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="border-4 border-black dark:border-white bg-white dark:bg-black shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="bg-black dark:bg-white pb-6 pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="text-3xl font-black text-white dark:text-black flex items-center gap-3">
                <Coffee className="h-8 w-8" />
                Order {order.order_number || `#${order.id.slice(0, 8)}`}
              </CardTitle>
              <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white dark:bg-black text-black dark:text-white border-2 border-white dark:border-black">
                {getStatusIcon()}
                <span className="font-bold text-lg">{getStatusText()}</span>
              </div>
            </div>
            <p className="text-base text-gray-300 dark:text-gray-700 mt-3 font-medium">
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            <div className="space-y-5">
              {order.items.map((item) => (
                <div key={item.id} className="border-3 border-gray-200 dark:border-gray-800 rounded-2xl p-5 bg-gray-50 dark:bg-gray-900 hover:shadow-lg transition-all hover:scale-[1.02]">
                  <div className="flex gap-5">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-white dark:bg-black flex-shrink-0 shadow-lg border-2 border-gray-900 dark:border-white">
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
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-xl text-black dark:text-white">{item.menu_item.name}</h4>
                          {item.options.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.options.map((opt) => (
                                <span 
                                  key={`${opt.key}-${opt.value}`}
                                  className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded-lg font-bold border-2 border-gray-900 dark:border-white"
                                >
                                  {opt.key}: {opt.value}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.note && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 font-semibold border-l-4 border-black dark:border-white pl-3 bg-white dark:bg-black py-2 rounded-r-lg">
                              Note: {item.note}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-black text-2xl text-black dark:text-white">x{item.qty}</div>
                          <div className="text-lg font-bold text-gray-700 dark:text-gray-300 mt-1">
                            {(item.price_each * item.qty).toFixed(2)} EGP
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="border-t-4 border-black dark:border-white pt-6 mt-6">
                <div className="flex justify-between items-center p-6 bg-black dark:bg-white rounded-2xl">
                  <span className="text-3xl font-black text-white dark:text-black">TOTAL</span>
                  <span className="text-4xl font-black text-white dark:text-black">
                    {order.total_amount.toFixed(2)} EGP
                  </span>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={() => navigate('/')}
                  className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-bold text-lg py-5 rounded-xl shadow-2xl hover:scale-105 transition-all"
                >
                  <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
                  Order More Items
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
