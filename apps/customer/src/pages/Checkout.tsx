import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../store/cart';
import { createOrder, createCheckoutSession, getItemImage } from '@coffee-demo/api-client';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@coffee-demo/ui';
import { Trash2, Plus, Minus, ShoppingBag, CreditCard, ArrowLeft } from 'lucide-react';

export function Checkout() {
  const { items, tableId, getTotal, removeItem, updateQuantity, getOptionsKey } = useCart();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (items.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setLoading(true);
    try {
      // Calculate financial breakdown
      const calculatedSubtotal = items.reduce(
        (sum, item) => sum + (item.base_price + item.options.reduce((s, opt) => s + opt.price_delta, 0)) * item.qty,
        0
      );
      const calculatedTaxAmount = calculatedSubtotal * 0.14; // 14% VAT
      
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
          product_name: item.name, // Snapshot of product name
        })),
        total_amount: getTotal(),
        // Financial breakdown
        subtotal: calculatedSubtotal,
        tax_amount: calculatedTaxAmount,
        // Location
        location: tableId ? 'dine-in' : 'takeout',
      });

      await createCheckoutSession(order.id);
      // Navigate to payment page using hash router
      navigate(`/payment/${order.id}`);
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to create order. Please try again.');
      setIsSubmitting(false);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="h-16 w-16 text-amber-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4 text-amber-900 dark:text-amber-100">Your cart is empty</h2>
        <p className="text-amber-700/70 dark:text-amber-400/70 mb-6">Add some delicious items to get started!</p>
        <Button 
          onClick={() => navigate('/')}
          className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Browse Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-700 to-amber-900 dark:from-amber-400 dark:to-amber-600 bg-clip-text text-transparent flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-amber-600" />
          Checkout
        </h2>
        <p className="text-amber-700/70 dark:text-amber-400/70">Review your order before proceeding</p>
      </div>
      <div className="space-y-4 mb-8">
        {items.map((item, idx) => {
          const itemPrice = item.base_price + item.options.reduce((sum, opt) => sum + opt.price_delta, 0);
          const optionsKey = getOptionsKey(item.options);
          return (
            <Card 
              key={`${item.menu_item_id}-${idx}`}
              className="border-amber-200 dark:border-amber-800 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className="flex gap-4 p-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex-shrink-0 shadow-lg border-2 border-gray-900 dark:border-white">
                  <img 
                    src={getItemImage(item.name, item)} 
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200/000000/ffffff?text=' + encodeURIComponent(item.name.substring(0, 2));
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-1">{item.name}</CardTitle>
                      {item.options.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.options.map((opt) => (
                            <span 
                              key={`${opt.key}-${opt.value}`} 
                              className="text-xs px-2 py-1 bg-amber-200 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full font-medium"
                            >
                              {opt.key}: {opt.value}
                              {opt.price_delta > 0 && ` (+${opt.price_delta} EGP)`}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.menu_item_id, optionsKey)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.menu_item_id, optionsKey, item.qty - 1)}
                        className="border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-xl font-bold text-amber-900 dark:text-amber-100 w-8 text-center">{item.qty}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.menu_item_id, optionsKey, item.qty + 1)}
                        className="border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-amber-900 dark:from-amber-400 dark:to-amber-600 bg-clip-text text-transparent">
                      {(itemPrice * item.qty).toFixed(2)} EGP
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <Card className="border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-amber-600" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <span className="text-xl font-semibold text-amber-900 dark:text-amber-100">Total</span>
            <span className="text-4xl font-bold bg-gradient-to-r from-amber-700 to-amber-900 dark:from-amber-400 dark:to-amber-600 bg-clip-text text-transparent">
              {getTotal().toFixed(2)} EGP
            </span>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold shadow-lg text-lg py-6"
            onClick={handleCheckout}
            disabled={loading || isSubmitting}
          >
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Proceed to Payment
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

