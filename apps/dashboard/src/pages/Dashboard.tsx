import { useEffect, useState } from 'react';
import { supabase, getOrders } from '@coffee-demo/api-client';
import { Card, CardContent, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@coffee-demo/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Database } from '@coffee-demo/api-client';

type Order = Database['public']['Tables']['orders']['Row'] & {
  items: Array<{
    id: string;
    qty: number;
    price_each: number;
    menu_item: { name: string };
  }>;
  payments: Array<{
    status: string;
    amount: number;
  }>;
};

export function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const ordersData = await getOrders();
        setOrders(ordersData as Order[]);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoading(false);
      }
    }
    load();

    // Subscribe to order updates (or poll in demo mode)
    const channel = supabase
      .channel('dashboard-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          load();
        }
      )
      .subscribe();

    // Poll for updates in demo mode (every 3 seconds)
    const pollInterval = setInterval(() => {
      load();
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (channelFilter !== 'all' && order.channel !== channelFilter) return false;
    return true;
  });

  // KPIs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ordersToday = orders.filter((o) => new Date(o.created_at) >= today);
  const paidOrders = orders.filter((o) => o.status === 'paid' || o.status === 'in_prep' || o.status === 'ready' || o.status === 'served');
  const revenue = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
  
  // Calculate average prep time (paid -> ready)
  const completedOrders = orders.filter((o) => o.status === 'served' || o.status === 'ready');
  const avgPrepTime = completedOrders.length > 0
    ? completedOrders.reduce((sum, o) => {
        const paidTime = o.payments?.[0]?.status === 'succeeded' ? new Date(o.created_at).getTime() : null;
        const readyTime = o.status === 'ready' || o.status === 'served' ? new Date(o.created_at).getTime() : null;
        if (paidTime && readyTime) {
          return sum + (readyTime - paidTime) / 1000 / 60; // minutes
        }
        return sum;
      }, 0) / completedOrders.length
    : 0;

  // Chart data
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const hourOrders = ordersToday.filter((o) => {
      const orderHour = new Date(o.created_at).getHours();
      return orderHour === hour;
    });
    return {
      hour: `${hour}:00`,
      orders: hourOrders.length,
      revenue: hourOrders.reduce((sum, o) => sum + (o.payments?.[0]?.status === 'succeeded' ? o.total_amount : 0), 0),
    };
  });

  const channelData = ['table', 'kiosk', 'cashier', 'web'].map((channel) => ({
    channel,
    count: ordersToday.filter((o) => o.channel === channel).length,
  }));

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersToday.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenue.toFixed(2)} EGP</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg Prep Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPrepTime.toFixed(1)} min</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o) => o.status === 'paid' || o.status === 'in_prep' || o.status === 'ready').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Orders by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Orders by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Orders</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="in_prep">In Prep</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="served">Served</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="kiosk">Kiosk</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="web">Web</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="border rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Channel: {order.channel} | Status: {order.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{order.total_amount.toFixed(2)} EGP</p>
                  </div>
                </div>
                <div className="mt-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="text-sm">
                      {item.qty}x {item.menu_item.name} - {(item.price_each * item.qty).toFixed(2)} EGP
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No orders found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

