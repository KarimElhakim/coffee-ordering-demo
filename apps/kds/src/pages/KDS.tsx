import { useEffect, useState, useRef } from 'react';
import { supabase, getKdsTickets, updateKdsTicketStatus, getStations } from '@coffee-demo/api-client';
import { Card, CardContent, CardHeader, CardTitle, Button, Tabs, TabsList, TabsTrigger, TabsContent } from '@coffee-demo/ui';
import { Play, CheckCircle, ArrowLeft } from 'lucide-react';
import type { Database } from '@coffee-demo/api-client';

type Ticket = Database['public']['Tables']['kds_tickets']['Row'] & {
  order: Database['public']['Tables']['orders']['Row'] & {
    items: Array<{
      id: string;
      qty: number;
      menu_item: { name: string };
      options: Array<{ key: string; value: string }>;
    }>;
  };
  station: Database['public']['Tables']['stations']['Row'];
};

export function KDS() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stations, setStations] = useState<Database['public']['Tables']['stations']['Row'][]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [newTickets, setNewTickets] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [ticketsData, stationsData] = await Promise.all([
          getKdsTickets(),
          getStations(),
        ]);
        setTickets(ticketsData as Ticket[]);
        setStations(stationsData);
        if (stationsData.length > 0 && !selectedStation) {
          setSelectedStation(stationsData[0].id);
        }
      } catch (error) {
        console.error('Failed to load tickets:', error);
      }
    }
    load();

    // Subscribe to new tickets
    const channel = supabase
      .channel('kds-tickets')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'kds_tickets',
        },
        (payload) => {
          setNewTickets((prev) => new Set([...prev, payload.new.id as string]));
          // Visual pulse effect
          setTimeout(() => {
            setNewTickets((prev) => {
              const next = new Set(prev);
              next.delete(payload.new.id as string);
              return next;
            });
          }, 3000);
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredTickets = selectedStation && selectedStation !== 'all'
    ? tickets.filter((t) => t.station_id === selectedStation)
    : tickets;

  const ticketsByStatus = {
    new: filteredTickets.filter((t) => t.status === 'new'),
    prep: filteredTickets.filter((t) => t.status === 'prep'),
    ready: filteredTickets.filter((t) => t.status === 'ready'),
  };

  const handleStatusChange = async (ticketId: string, newStatus: 'new' | 'prep' | 'ready') => {
    try {
      await updateKdsTicketStatus(ticketId, newStatus);
      const updated = await getKdsTickets();
      setTickets(updated as Ticket[]);
    } catch (error) {
      console.error('Failed to update ticket:', error);
      alert('Failed to update ticket status');
    }
  };

  const handleRecall = async (ticketId: string) => {
    try {
      await updateKdsTicketStatus(ticketId, 'new');
      const updated = await getKdsTickets();
      setTickets(updated as Ticket[]);
    } catch (error) {
      console.error('Failed to recall ticket:', error);
      alert('Failed to recall ticket');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      case 'prep':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      case 'ready':
        return 'border-green-500 bg-green-50 dark:bg-green-950';
      default:
        return '';
    }
  };

  const TicketCard = ({ ticket }: { ticket: Ticket }) => {
    const isNew = newTickets.has(ticket.id);
    return (
      <Card
        className={`${getStatusColor(ticket.status)} ${isNew ? 'animate-pulse ring-2 ring-primary' : ''}`}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Order #{ticket.order.id.slice(0, 8)}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(ticket.created_at).toLocaleTimeString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{ticket.station.name}</p>
              {ticket.order.table_id && (
                <p className="text-xs text-muted-foreground">Table {ticket.order.table_id}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            {ticket.order.items.map((item) => (
              <div key={item.id} className="border-b pb-2 last:border-0">
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">{item.menu_item.name}</p>
                    {item.options.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {item.options.map((opt) => `${opt.key}: ${opt.value}`).join(', ')}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold">x{item.qty}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {ticket.status === 'new' && (
              <Button
                className="flex-1"
                onClick={() => handleStatusChange(ticket.id, 'prep')}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Prep
              </Button>
            )}
            {ticket.status === 'prep' && (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleStatusChange(ticket.id, 'new')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Recall
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleStatusChange(ticket.id, 'ready')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Ready
                </Button>
              </>
            )}
            {ticket.status === 'ready' && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleRecall(ticket.id)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Recall
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <Tabs value={selectedStation || 'all'} onValueChange={(v) => setSelectedStation(v === 'all' ? null : v)}>
          <TabsList>
            <TabsTrigger value="all">All Stations</TabsTrigger>
            {stations.map((station) => (
              <TabsTrigger key={station.id} value={station.id}>
                {station.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h2 className="text-xl font-bold mb-4">New ({ticketsByStatus.new.length})</h2>
          <div className="space-y-4">
            {ticketsByStatus.new.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
            {ticketsByStatus.new.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No new tickets
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">In Prep ({ticketsByStatus.prep.length})</h2>
          <div className="space-y-4">
            {ticketsByStatus.prep.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
            {ticketsByStatus.prep.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No tickets in prep
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">Ready ({ticketsByStatus.ready.length})</h2>
          <div className="space-y-4">
            {ticketsByStatus.ready.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
            {ticketsByStatus.ready.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No ready tickets
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

