import { useEffect, useState } from 'react';
import { supabase, getOrders } from '@coffee-demo/api-client';
import { Card, CardContent, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@coffee-demo/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, DollarSign, Clock, ShoppingBag, TrendingUp, Filter, Table2, Users } from 'lucide-react';
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

  // Table status data
  const tableStatuses = Array.from({ length: 12 }, (_, i) => {
    const tableId = `table-${i + 1}`;
    const tableOrders = orders.filter((o) => o.table_id === tableId);
    const activeOrders = tableOrders.filter((o) => 
      o.status === 'paid' || o.status === 'in_prep' || o.status === 'ready'
    );
    const totalAmount = activeOrders.reduce((sum, o) => sum + o.total_amount, 0);
    
    let status: 'empty' | 'active' | 'serving' | 'needs-attention' = 'empty';
    if (activeOrders.length > 0) {
      if (activeOrders.some(o => o.status === 'ready')) {
        status = 'needs-attention';
      } else if (activeOrders.some(o => o.status === 'in_prep')) {
        status = 'serving';
      } else {
        status = 'active';
      }
    }

    return {
      id: tableId,
      number: i + 1,
      orders: activeOrders.length,
      totalAmount,
      status,
    };
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        <p className="mt-4 text-amber-700 dark:text-amber-400">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-900 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-blue-600" />
              Orders Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">{ordersToday.length}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-slate-800 dark:to-slate-900 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-400">{revenue.toFixed(2)} EGP</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-slate-800 dark:to-slate-900 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              Avg Prep Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">{avgPrepTime.toFixed(1)} min</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-slate-800 dark:to-slate-900 shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              Active Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-400">
              {orders.filter((o) => o.status === 'paid' || o.status === 'in_prep' || o.status === 'ready').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Diagram */}
      <Card className="border-amber-200 dark:border-amber-800 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
            <Table2 className="h-6 w-6 text-amber-600" />
            Table Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tableStatuses.map((table) => {
              const statusColors = {
                empty: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400',
                active: 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-400',
                serving: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-400',
                'needs-attention': 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600 text-green-700 dark:text-green-400 animate-pulse',
              };
              return (
                <div
                  key={table.id}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer ${statusColors[table.status]}`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-1">{table.number}</div>
                    <div className="text-xs font-semibold mb-2">Table {table.number}</div>
                    {table.orders > 0 && (
                      <>
                        <div className="flex items-center justify-center gap-1 text-xs mb-1">
                          <Users className="h-3 w-3" />
                          <span className="font-bold">{table.orders}</span>
                        </div>
                        <div className="text-xs font-semibold">{table.totalAmount.toFixed(0)} EGP</div>
                      </>
                    )}
                  </div>
                  {table.status === 'needs-attention' && (
                    <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"></div>
              <span className="text-amber-700 dark:text-amber-400">Empty</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600"></div>
              <span className="text-amber-700 dark:text-amber-400">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600"></div>
              <span className="text-amber-700 dark:text-amber-400">Serving</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600"></div>
              <span className="text-amber-700 dark:text-amber-400">Ready</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-amber-200 dark:border-amber-800 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-amber-600" />
              Orders by Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hour" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#fef3c7', border: '1px solid #fbbf24' }} />
                <Bar dataKey="orders" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-800 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              Orders by Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="channel" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#fef3c7', border: '1px solid #fbbf24' }} />
                <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card className="border-amber-200 dark:border-amber-800 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-amber-600" />
              Orders
            </CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] border-amber-300 dark:border-amber-700">
                  <Filter className="h-4 w-4 mr-2" />
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
                <SelectTrigger className="w-[150px] border-amber-300 dark:border-amber-700">
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
              <div key={order.id} className="border border-amber-200 dark:border-amber-800 rounded-lg p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-700 dark:to-slate-800 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-lg text-amber-900 dark:text-amber-100">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-amber-700/70 dark:text-amber-400/70 mt-1">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-1">
                      Channel: <span className="font-semibold">{order.channel}</span> | Status: <span className="font-semibold">{order.status}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl bg-gradient-to-r from-amber-700 to-amber-900 dark:from-amber-400 dark:to-amber-600 bg-clip-text text-transparent">
                      {order.total_amount.toFixed(2)} EGP
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {order.items.map((item) => (
                    <div key={item.id} className="text-sm text-amber-900 dark:text-amber-100">
                      <span className="font-semibold">{item.qty}x</span> {item.menu_item.name} - <span className="font-semibold text-amber-700 dark:text-amber-400">{(item.price_each * item.qty).toFixed(2)} EGP</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <div className="text-center py-12 text-amber-700/70 dark:text-amber-400/70">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No orders found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

