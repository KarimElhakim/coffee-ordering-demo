import { useEffect, useState } from 'react';
import { supabase, getKdsTickets, updateKdsTicketStatus, getStations, getItemImage, updateOrderStatus, setupSyncListener } from '@coffee-demo/api-client';
import { Card, CardContent, CardHeader, CardTitle, Button, Tabs, TabsList, TabsTrigger, TabsContent } from '@coffee-demo/ui';
import { Play, CheckCircle, ArrowLeft, Coffee, Clock, AlertCircle, Package, User, MapPin } from 'lucide-react';
import type { Database } from '@coffee-demo/api-client';
import { InventoryManagement } from '../components/InventoryManagement';

type Ticket = Database['public']['Tables']['kds_tickets']['Row'] & {
  order: Database['public']['Tables']['orders']['Row'] & {
    items: Array<{
      id: string;
      qty: number;
      menu_item: { name: string };
      options: Array<{ key: string; value: string }>;
      note?: string;
    }>;
  };
  station: Database['public']['Tables']['stations']['Row'];
};

export function KDS() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stations, setStations] = useState<Database['public']['Tables']['stations']['Row'][]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [newTickets, setNewTickets] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    async function load() {
      try {
        console.log('🍳 KDS: Loading data...');
        const [ticketsData, stationsData] = await Promise.all([
          getKdsTickets(),
          getStations(),
        ]);
        console.log('🍳 KDS: Loaded', ticketsData.length, 'tickets');
        console.log('🍳 KDS: Loaded', stationsData.length, 'stations');
        setTickets(ticketsData as Ticket[]);
        setStations(stationsData);
        if (stationsData.length > 0 && !selectedStation) {
          setSelectedStation('all');
        }
      } catch (error) {
        console.error('❌ KDS: Failed to load tickets:', error);
      }
    }
    load();

    // Subscribe to new tickets (only works in real Supabase mode)
    let channel: any = null;
    try {
      channel = supabase
        .channel('kds-tickets')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'kds_tickets',
          },
          (payload: any) => {
            setNewTickets((prev) => new Set([...prev, payload.new.id as string]));
            setTimeout(() => {
              setNewTickets((prev) => {
                const next = new Set(prev);
                next.delete(payload.new.id as string);
                return next;
              });
            }, 5000);
            load();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'kds_tickets',
          },
          () => {
            load();
          }
        )
        .subscribe();
    } catch (error) {
      console.log('Realtime subscriptions not available in demo mode');
    }

    // Poll for updates (every 3 seconds)
    const pollInterval = setInterval(() => {
      load();
    }, 3000);
    
    // Listen for cross-tab messages
    setupSyncListener((message) => {
      console.log('📡 KDS received broadcast:', message.type);
      if (message.type === 'order-created' || message.type === 'ticket-created') {
        // Reload when new orders/tickets are created
        setTimeout(() => load(), 500);
      }
    });

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          // Ignore errors in demo mode
        }
      }
      clearInterval(pollInterval);
    };
  }, [selectedStation]);

  const filteredTickets = selectedStation && selectedStation !== 'all'
    ? tickets.filter((t) => t.station_id === selectedStation)
    : tickets;

  const ticketsByStatus = {
    new: filteredTickets.filter((t) => t.status === 'new'),
    prep: filteredTickets.filter((t) => t.status === 'prep'),
    ready: filteredTickets.filter((t) => t.status === 'ready'),
  };

  const handleStatusChange = async (ticket: Ticket, newStatus: 'new' | 'prep' | 'ready') => {
    try {
      await updateKdsTicketStatus(ticket.id, newStatus);
      
      // Update order status based on ticket status
      if (newStatus === 'prep') {
        await updateOrderStatus(ticket.order_id, 'in_prep');
      } else if (newStatus === 'ready') {
        await updateOrderStatus(ticket.order_id, 'ready');
      }
      
      const updated = await getKdsTickets();
      setTickets(updated as Ticket[]);
    } catch (error) {
      console.error('Failed to update ticket:', error);
      alert('Failed to update ticket status');
    }
  };

  const getElapsedTime = (createdAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    return minutes;
  };

  const getTimeColor = (minutes: number) => {
    if (minutes < 5) return 'text-green-600 dark:text-green-400';
    if (minutes < 10) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const TicketCard = ({ ticket }: { ticket: Ticket }) => {
    const isNew = newTickets.has(ticket.id);
    const elapsedMinutes = getElapsedTime(ticket.created_at);
    
    const statusStyles = {
      new: 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900',
      prep: 'border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-800',
      ready: 'border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-950',
    };

    return (
      <Card
        className={`${statusStyles[ticket.status as keyof typeof statusStyles]} ${
          isNew ? 'animate-pulse ring-2 ring-gray-900 dark:ring-white' : ''
        } border-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]`}
      >
        <CardHeader className="pb-4">
          <div className="space-y-3">
            {/* Order Number & Station */}
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Coffee className="h-6 w-6" />
                {ticket.order.order_number || `#${ticket.order.id.slice(0, 8)}`}
              </CardTitle>
              <div className="inline-block px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold shadow-lg">
                {ticket.station.name}
              </div>
            </div>

            {/* Table / Takeaway Badge */}
            {((ticket as any).order_type || (ticket as any).table_id) && (
              <div className="flex items-center gap-2">
                {(ticket as any).order_type === 'takeaway' ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-md">
                    <Package className="h-5 w-5" />
                    <span>📦 TAKEAWAY</span>
                  </div>
                ) : (ticket as any).table_id ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md">
                    <MapPin className="h-5 w-5" />
                    <span>🍽️ Table {(ticket as any).table_id}</span>
                  </div>
                ) : null}
              </div>
            )}
            
            {/* Meta Information */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <p className={`text-base font-bold flex items-center gap-2 ${getTimeColor(elapsedMinutes)}`}>
                  <Clock className="h-5 w-5" />
                  {elapsedMinutes} min
                </p>
                {ticket.order.customer_name && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1.5 font-medium">
                    <User className="h-4 w-4" />
                    {ticket.order.customer_name}
                  </p>
                )}
              </div>
              {ticket.order.location && (
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 capitalize font-medium">
                  <MapPin className="h-4 w-4" />
                  {ticket.order.location}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-5">
            {ticket.order.items && ticket.order.items.length > 0 ? (
              ticket.order.items.map((item: any) => (
                <div 
                  key={item.id} 
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 shadow-sm"
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 shadow-md">
                      <img 
                        src={getItemImage(item.menu_item?.name || 'Coffee')} 
                        alt={item.menu_item?.name || 'Item'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x100/000000/ffffff?text=' + encodeURIComponent((item.menu_item?.name || 'Item').substring(0, 2));
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-xl text-gray-900 dark:text-white">
                          {item.menu_item?.name || 'Unknown Item'}
                        </p>
                        <div className="flex-shrink-0 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full w-10 h-10 flex items-center justify-center ml-3 shadow-md">
                          <p className="font-bold text-lg">×{item.qty}</p>
                        </div>
                      </div>
                      {item.options && item.options.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.options.map((opt: any, idx: number) => (
                            <span 
                              key={idx} 
                              className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-semibold border border-gray-300 dark:border-gray-600"
                            >
                              {opt.key}: {opt.value}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.note && (
                        <p className="text-sm text-gray-800 dark:text-gray-200 mt-2 pl-3 border-l-[3px] border-gray-400 dark:border-gray-500 italic font-medium">
                          "{item.note}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-base font-medium">No items found</p>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-5 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
            {ticket.status === 'new' && (
              <Button
                className="flex-1 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 py-6 text-base"
                onClick={() => handleStatusChange(ticket, 'prep')}
              >
                <Play className="h-5 w-5 mr-2" />
                Start Prep
              </Button>
            )}
            {ticket.status === 'prep' && (
              <>
                <Button
                  variant="outline"
                  className="flex-1 border-2 border-gray-300 dark:border-gray-700 rounded-xl hover:border-gray-400 dark:hover:border-gray-600 font-bold py-6 text-base"
                  onClick={() => handleStatusChange(ticket, 'new')}
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </Button>
                <Button
                  className="flex-1 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 py-6 text-base"
                  onClick={() => handleStatusChange(ticket, 'ready')}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Ready
                </Button>
              </>
            )}
            {ticket.status === 'ready' && (
              <Button
                variant="outline"
                className="flex-1 border-2 border-gray-300 dark:border-gray-700 rounded-xl hover:border-gray-400 dark:hover:border-gray-600 font-bold py-6 text-base"
                onClick={() => handleStatusChange(ticket, 'prep')}
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Recall
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6 relative">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-100 dark:bg-gray-800 mb-6 p-1 rounded-xl border-2 border-gray-200 dark:border-gray-700 inline-flex gap-1">
          <TabsTrigger 
            value="orders" 
            className="data-[state=active]:bg-gray-900 data-[state=active]:dark:bg-white data-[state=active]:text-white data-[state=active]:dark:text-gray-900 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 px-4 py-2"
          >
            <Coffee className="h-5 w-5" />
            <span>Order Queue</span>
          </TabsTrigger>
          <TabsTrigger 
            value="inventory" 
            className="data-[state=active]:bg-gray-900 data-[state=active]:dark:bg-white data-[state=active]:text-white data-[state=active]:dark:text-gray-900 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 px-4 py-2"
          >
            <Package className="h-5 w-5" />
            <span>Inventory</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          {/* Station Filter */}
          <div className="mb-6">
            <Tabs value={selectedStation || 'all'} onValueChange={(v) => setSelectedStation(v === 'all' ? 'all' : v)}>
              <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border-2 border-gray-200 dark:border-gray-700">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-gray-900 data-[state=active]:dark:bg-white data-[state=active]:text-white data-[state=active]:dark:text-gray-900 rounded-lg font-semibold px-6 py-2 transition-all duration-200"
                >
                  All Stations
                </TabsTrigger>
                {stations.map((station) => (
                  <TabsTrigger 
                    key={station.id} 
                    value={station.id} 
                    className="data-[state=active]:bg-gray-900 data-[state=active]:dark:bg-white data-[state=active]:text-white data-[state=active]:dark:text-gray-900 rounded-lg font-semibold px-6 py-2 transition-all duration-200"
                  >
                    {station.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Order Queue Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* New Orders */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-600"></div>
                  New
                </h2>
                <div className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-bold">
                  {ticketsByStatus.new.length}
                </div>
              </div>
              <div className="space-y-4">
                {ticketsByStatus.new.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
                {ticketsByStatus.new.length === 0 && (
                  <Card className="border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <CardContent className="py-12 text-center">
                      <Clock className="h-16 w-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400 font-semibold">No new orders</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* In Progress */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-600 dark:bg-gray-400"></div>
                  Preparing
                </h2>
                <div className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-bold">
                  {ticketsByStatus.prep.length}
                </div>
              </div>
              <div className="space-y-4">
                {ticketsByStatus.prep.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
                {ticketsByStatus.prep.length === 0 && (
                  <Card className="border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <CardContent className="py-12 text-center">
                      <Play className="h-16 w-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400 font-semibold">No orders in prep</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Ready */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-900 dark:bg-white"></div>
                  Ready
                </h2>
                <div className="px-3 py-1 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold">
                  {ticketsByStatus.ready.length}
                </div>
              </div>
              <div className="space-y-4">
                {ticketsByStatus.ready.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
                {ticketsByStatus.ready.length === 0 && (
                  <Card className="border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <CardContent className="py-12 text-center">
                      <CheckCircle className="h-16 w-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400 font-semibold">No ready orders</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inventory">
          <InventoryManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
