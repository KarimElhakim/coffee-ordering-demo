import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../store/cart';
import { createOrder, createCheckoutSession, getItemImage } from '@coffee-demo/api-client';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@coffee-demo/ui';
import { Trash2, Plus, Minus, ShoppingBag, CreditCard, ArrowLeft, Sparkles } from 'lucide-react';

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
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-4 border-black dark:border-white shadow-2xl bg-white dark:bg-black">
          <CardContent className="pt-16 pb-16 text-center">
            <ShoppingBag className="h-24 w-24 text-black dark:text-white mx-auto mb-6" />
            <h2 className="text-4xl font-black mb-4 text-black dark:text-white">Your cart is empty</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 font-medium">
              Add some delicious items to get started
            </p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-bold text-lg px-8 py-6 shadow-2xl hover:scale-105 transition-all"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Browse Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-black dark:via-gray-950 dark:to-black py-8 px-4 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10 animate-fade-in-down">
          <h2 className="text-6xl font-black mb-4 text-black dark:text-white tracking-tight flex items-center gap-4">
            <ShoppingBag className="h-14 w-14" />
            Checkout
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-medium ml-1">
            Review your order before proceeding
          </p>
        </div>

        {/* Cart Items */}
        <div className="space-y-6 mb-10">
          {items.map((item, idx) => {
            const itemPrice = item.base_price + item.options.reduce((sum, opt) => sum + opt.price_delta, 0);
            const optionsKey = getOptionsKey(item.options);
            return (
              <Card 
                key={`${item.menu_item_id}-${idx}`}
                className="border-4 border-black dark:border-white bg-white dark:bg-black shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden group animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex gap-6 p-6">
                  {/* Item Image */}
                  <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900 flex-shrink-0 shadow-xl border-3 border-gray-900 dark:border-white">
                    <img 
                      src={getItemImage(item.name, item)} 
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200/000000/ffffff?text=' + encodeURIComponent(item.name.substring(0, 2));
                      }}
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-2xl font-black text-black dark:text-white mb-3">
                          {item.name}
                        </CardTitle>
                        
                        {/* Options */}
                        {item.options.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {item.options.map((opt) => (
                              <span 
                                key={`${opt.key}-${opt.value}`} 
                                className="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-900 text-black dark:text-white rounded-xl font-bold border-2 border-gray-900 dark:border-white"
                              >
                                {opt.key}: {opt.value}
                                {opt.price_delta > 0 && ` (+${opt.price_delta} EGP)`}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Note */}
                        {item.note && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 font-semibold border-l-4 border-black dark:border-white pl-4 bg-gray-50 dark:bg-gray-900 py-2 rounded-r-lg">
                            Note: {item.note}
                          </p>
                        )}
                      </div>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.menu_item_id, optionsKey)}
                        className="text-red-600 hover:text-white hover:bg-red-600 dark:text-red-400 dark:hover:text-black dark:hover:bg-red-400 flex-shrink-0 h-12 w-12 border-2 border-red-600 dark:border-red-400 rounded-xl transition-all hover:scale-110"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Quantity and Price */}
                    <div className="flex items-center justify-between mt-6 pt-6 border-t-3 border-gray-900 dark:border-white">
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.menu_item_id, optionsKey, item.qty - 1)}
                          className="border-3 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black h-12 w-12 rounded-xl font-black transition-all hover:scale-110"
                        >
                          <Minus className="h-5 w-5" />
                        </Button>
                        <span className="text-3xl font-black text-black dark:text-white w-16 text-center">
                          {item.qty}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.menu_item_id, optionsKey, item.qty + 1)}
                          className="border-3 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black h-12 w-12 rounded-xl font-black transition-all hover:scale-110"
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                      <span className="text-3xl font-black text-black dark:text-white">
                        {(itemPrice * item.qty).toFixed(2)} EGP
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Order Summary */}
        <Card className="border-4 border-black dark:border-white bg-white dark:bg-black shadow-2xl animate-fade-in-up" style={{ animationDelay: `${items.length * 0.1}s` }}>
          <CardHeader className="bg-black dark:bg-white pb-8 pt-8">
            <CardTitle className="text-3xl font-black text-white dark:text-black flex items-center gap-3">
              <CreditCard className="h-8 w-8" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-10 pb-10">
            {/* Subtotal */}
            <div className="flex justify-between items-center mb-6 pb-6 border-b-2 border-gray-200 dark:border-gray-800">
              <span className="text-xl font-bold text-gray-700 dark:text-gray-300">Subtotal</span>
              <span className="text-2xl font-black text-black dark:text-white">
                {getTotal().toFixed(2)} EGP
              </span>
            </div>

            {/* Tax */}
            <div className="flex justify-between items-center mb-6 pb-6 border-b-2 border-gray-200 dark:border-gray-800">
              <span className="text-xl font-bold text-gray-700 dark:text-gray-300">VAT (14%)</span>
              <span className="text-2xl font-black text-black dark:text-white">
                {(getTotal() * 0.14).toFixed(2)} EGP
              </span>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center mb-10 p-6 bg-black dark:bg-white rounded-2xl">
              <span className="text-3xl font-black text-white dark:text-black">TOTAL</span>
              <span className="text-4xl font-black text-white dark:text-black">
                {(getTotal() * 1.14).toFixed(2)} EGP
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-6">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1 border-4 border-gray-900 dark:border-white hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-black font-bold text-xl h-16 transition-all hover:scale-105"
              >
                <ArrowLeft className="h-6 w-6 mr-2" />
                Back to Menu
              </Button>
              <Button
                className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-black text-xl h-16 shadow-2xl hover:shadow-black/50 dark:hover:shadow-white/50 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                onClick={handleCheckout}
                disabled={loading || isSubmitting}
              >
                {loading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-4 border-white dark:border-black mr-3"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-6 w-6 mr-3 animate-pulse" />
                    Proceed to Payment
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
