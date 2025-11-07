import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../store/cart';
import { createOrder, createCheckoutSession } from '@coffee-demo/api-client';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@coffee-demo/ui';
import { Trash2, Plus, Minus } from 'lucide-react';

export function Checkout() {
  const { items, tableId, clearCart, getTotal, removeItem, updateQuantity, getOptionsKey } = useCart();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setLoading(true);
    try {
      const order = await createOrder({
        store_id: '1',
        table_id: tableId || null,
        channel: tableId ? 'table' : 'kiosk',
        items: items.map((item) => ({
          menu_item_id: item.menu_item_id,
          qty: item.qty,
          price_each: item.base_price + item.options.reduce((sum, opt) => sum + opt.price_delta, 0),
          note: item.note,
          options: item.options,
        })),
        total_amount: getTotal(),
      });

      const { url } = await createCheckoutSession(order.id);
      if (url) {
        // Use hash router navigation for demo mode
        navigate(url.replace(window.location.origin, ''));
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Button onClick={() => navigate('/')}>Browse Menu</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-8">Checkout</h2>
      <div className="space-y-4 mb-8">
        {items.map((item, idx) => {
          const itemPrice = item.base_price + item.options.reduce((sum, opt) => sum + opt.price_delta, 0);
          const optionsKey = getOptionsKey(item.options);
          return (
            <Card key={`${item.menu_item_id}-${idx}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{item.name}</CardTitle>
                    {item.options.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {item.options.map((opt) => (
                          <div key={`${opt.key}-${opt.value}`}>
                            {opt.key}: {opt.value}
                            {opt.price_delta > 0 && ` (+${opt.price_delta} EGP)`}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.menu_item_id, optionsKey)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.menu_item_id, optionsKey, item.qty - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-semibold">{item.qty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.menu_item_id, optionsKey, item.qty + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-lg font-bold">
                    {(itemPrice * item.qty).toFixed(2)} EGP
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg">Total</span>
            <span className="text-2xl font-bold">{getTotal().toFixed(2)} EGP</span>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

