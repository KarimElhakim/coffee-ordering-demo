import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrders, markOrderPaid, getItemImage } from '@coffee-demo/api-client';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@coffee-demo/ui';
import { CheckCircle, CreditCard, Lock, ArrowLeft, ShoppingBag } from 'lucide-react';

export function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) return;
      const orders = await getOrders();
      const found = orders.find((o: any) => o.id === orderId);
      if (found) {
        setOrder(found);
      }
    }
    loadOrder();
  }, [orderId]);

  const handlePayment = async () => {
    if (!order || !cardNumber || !expiry || !cvc || !name || isSubmitting) {
      if (!isSubmitting) {
        alert('Please fill in all payment details');
      }
      return;
    }

    setIsSubmitting(true);
    setProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      // Mark order as paid (works in demo mode)
      await markOrderPaid(order.id, 'card_present_demo', order.total_amount);
      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(`/order/${order.id}?success=true`);
      }, 2000);
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
      setProcessing(false);
      setIsSubmitting(false);
    }
  };

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

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card className="border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 shadow-2xl">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="inline-block p-4 bg-green-500 rounded-full mb-4 animate-bounce">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2 text-green-700 dark:text-green-400">Payment Successful!</h2>
              <p className="text-green-700/70 dark:text-green-400/70 mb-6">
                Your order has been received and is being prepared.
              </p>
              <Button 
                onClick={() => navigate(`/order/${order.id}?success=true`)}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                View Order Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-700 to-amber-900 dark:from-amber-400 dark:to-amber-600 bg-clip-text text-transparent flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-amber-600" />
          Payment
        </h2>
        <p className="text-amber-700/70 dark:text-amber-400/70">Complete your order payment</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-amber-200 dark:border-amber-800 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-600" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cardNumber" className="text-amber-900 dark:text-amber-100">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, '');
                    if (value.length <= 16 && /^\d*$/.test(value)) {
                      setCardNumber(value.replace(/(.{4})/g, '$1 ').trim());
                    }
                  }}
                  maxLength={19}
                  className="mt-2 border-amber-300 dark:border-amber-700 text-lg font-mono"
                />
                <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-1">
                  Demo: Use any card number (e.g., 4242 4242 4242 4242)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry" className="text-amber-900 dark:text-amber-100">Expiry (MM/YY)</Label>
                  <Input
                    id="expiry"
                    placeholder="12/25"
                    value={expiry}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 4) {
                        setExpiry(value.replace(/(.{2})/, '$1/'));
                      }
                    }}
                    maxLength={5}
                    className="mt-2 border-amber-300 dark:border-amber-700 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="cvc" className="text-amber-900 dark:text-amber-100">CVC</Label>
                  <Input
                    id="cvc"
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 3) {
                        setCvc(value);
                      }
                    }}
                    maxLength={3}
                    className="mt-2 border-amber-300 dark:border-amber-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="name" className="text-amber-900 dark:text-amber-100">Cardholder Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 border-amber-300 dark:border-amber-700"
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900 shadow-xl sticky top-24">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-amber-600" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items && order.items.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex gap-2 text-sm">
                      <div className="w-10 h-10 rounded overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 dark:from-slate-700 dark:to-slate-800 flex-shrink-0">
                        <img 
                          src={getItemImage(item.menu_item?.name || 'Coffee')} 
                          alt={item.menu_item?.name || 'Item'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x100/f59e0b/ffffff?text=' + encodeURIComponent((item.menu_item?.name || 'Item').substring(0, 2));
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-amber-900 dark:text-amber-100 truncate">{item.menu_item?.name || 'Item'}</p>
                        <p className="text-xs text-amber-700/70 dark:text-amber-400/70">x{item.qty}</p>
                      </div>
                      <p className="font-bold text-amber-700 dark:text-amber-400">{(item.price_each * item.qty).toFixed(0)} EGP</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-amber-200 dark:border-amber-800 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-amber-900 dark:text-amber-100">Total</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-amber-900 dark:from-amber-400 dark:to-amber-600 bg-clip-text text-transparent">
                    {order.total_amount.toFixed(2)} EGP
                  </span>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold shadow-lg text-lg py-6"
                  onClick={handlePayment}
                  disabled={processing || isSubmitting || !cardNumber || !expiry || !cvc || !name}
                >
                  {processing ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5 mr-2" />
                      Pay {order.total_amount.toFixed(2)} EGP
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-amber-700/70 dark:text-amber-400/70 mt-3">
                  This is a demo payment system. No real charges will be made.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

