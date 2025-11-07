import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrders, markOrderPaid, getItemImage } from '@coffee-demo/api-client';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@coffee-demo/ui';
import { CheckCircle, Lock, ArrowLeft, ShoppingBag } from 'lucide-react';

export function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [processing, setProcessing] = useState(false);
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
    if (!order || !cardNumber || !expiry || !cvc || !name) {
      alert('Please fill in all payment details');
      return;
    }

    setProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      // Mark order as paid (works in demo mode)
      await markOrderPaid(order.id, 'card_present_demo', order.total_amount);
      setSuccess(true);

      // Redirect back to POS after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading order...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-green-500 dark:bg-green-400 flex items-center justify-center mx-auto mb-6 animate-bounce-in">
            <CheckCircle className="h-16 w-16 text-white animate-checkmark" strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Payment Successful!</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">Redirecting to POS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="mb-6 border-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to POS
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Lock className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cardNumber" className="text-gray-900 dark:text-white mb-2 block">
                  Card Number
                </Label>
                <Input
                  id="cardNumber"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                  maxLength={19}
                  className="border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:border-gray-900 dark:focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry" className="text-gray-900 dark:text-white mb-2 block">
                    Expiry Date
                  </Label>
                  <Input
                    id="expiry"
                    type="text"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2, 4);
                      }
                      setExpiry(value);
                    }}
                    maxLength={5}
                    className="border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:border-gray-900 dark:focus:border-white"
                  />
                </div>
                <div>
                  <Label htmlFor="cvc" className="text-gray-900 dark:text-white mb-2 block">
                    CVC
                  </Label>
                  <Input
                    id="cvc"
                    type="text"
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    maxLength={3}
                    className="border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:border-gray-900 dark:focus:border-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="name" className="text-gray-900 dark:text-white mb-2 block">
                  Cardholder Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:border-gray-900 dark:focus:border-white"
                />
              </div>

              <Button
                className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold shadow-lg text-lg py-6 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={handlePayment}
                disabled={processing || !cardNumber || !expiry || !cvc || !name}
              >
                {processing ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:border-gray-900 mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Pay {order.total_amount.toFixed(2)} EGP
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-3">
                This is a demo payment system. No real charges will be made.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.items && order.items.length > 0 && (
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="flex gap-3 p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                        <img
                          src={getItemImage(item.menu_item?.name || 'Coffee')}
                          alt={item.menu_item?.name || 'Item'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x100/000000/ffffff?text=' + encodeURIComponent(item.menu_item?.name?.substring(0, 2) || 'C');
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.menu_item?.name || 'Item'}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Qty: {item.qty}</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                          {(item.price_each * item.qty).toFixed(0)} EGP
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {order.total_amount.toFixed(2)} EGP
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

