import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature', { status: 400 });
    }

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;

      if (!orderId) {
        console.error('No order_id in session metadata');
        return new Response('No order_id', { status: 400 });
      }

      // Update payment status
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ status: 'succeeded' })
        .eq('ext_ref', session.id);

      if (paymentError) {
        console.error('Error updating payment:', paymentError);
        return new Response('Error updating payment', { status: 500 });
      }

      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId);

      if (orderError) {
        console.error('Error updating order:', orderError);
        return new Response('Error updating order', { status: 500 });
      }

      // Get order items with their stations
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          menu_item:menu_items(station_id)
        `)
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        return new Response('Error fetching order items', { status: 500 });
      }

      // Create KDS tickets for each station
      const tickets = items
        .filter((item) => item.menu_item?.station_id)
        .map((item) => ({
          order_id: orderId,
          station_id: item.menu_item.station_id,
          status: 'new',
        }));

      if (tickets.length > 0) {
        const { error: ticketsError } = await supabase
          .from('kds_tickets')
          .insert(tickets);

        if (ticketsError) {
          console.error('Error creating KDS tickets:', ticketsError);
          return new Response('Error creating KDS tickets', { status: 500 });
        }
      }

      console.log(`Order ${orderId} processed successfully`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(`Webhook Error: ${error.message}`, { status: 500 });
  }
});

