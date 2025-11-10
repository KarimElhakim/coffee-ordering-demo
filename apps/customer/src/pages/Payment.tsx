import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrders, markOrderPaid, getItemImage, getTables } from '@coffee-demo/api-client';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@coffee-demo/ui';
import { CheckCircle, CreditCard, Lock, ArrowLeft, ShoppingBag, Wallet, Store, PackagePlus, Home, Check, X } from 'lucide-react';

export function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);
  
  // Payment flow state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | null>(null);
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | null>(null);
  const [selectedTable, setSelectedTable] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!orderId) return;
      const orders = await getOrders();
      const found = orders.find((o: any) => o.id === orderId);
      if (found) {
        setOrder(found);
      }
      
      // Load tables for selection
      const allTables = await getTables();
      setTables(allTables);
    }
    loadData();
  }, [orderId]);

  const handleConfirmPayment = () => {
    // Validation
    if (paymentMethod === 'cash' && !selectedTable) {
      alert('Please select a table for cash payment');
      return;
    }
    
    if (paymentMethod === 'card') {
      if (!orderType) {
        alert('Please choose Dine-In or Takeaway');
        return;
      }
      if (orderType === 'dine-in' && !selectedTable) {
        alert('Please select a table');
        return;
      }
      if (!cardNumber || !expiry || !cvc || !name) {
        alert('Please fill in all card details');
        return;
      }
    }
    
    setShowConfirmation(true);
  };

  const handleFinalPayment = async () => {
    setProcessing(true);
    setShowConfirmation(false);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2500));

    try {
      const paymentData: any = {
        payment_method: paymentMethod,
        order_type: paymentMethod === 'cash' ? 'dine-in' : orderType,
        table_id: selectedTable || null,
      };

      await markOrderPaid(order.id, paymentMethod === 'cash' ? 'cash' : 'card_present_demo', order.total_amount, paymentData);
      setSuccess(true);

      // Redirect after showing success
      setTimeout(() => {
        navigate(`/order/${order.id}?success=true`);
      }, 2500);
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-emerald-200 dark:border-emerald-800 shadow-2xl">
          <CardContent className="pt-12 pb-12 text-center">
            <ShoppingBag className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Order not found</h2>
            <Button 
              onClick={() => navigate('/')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success Screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-green-200 dark:border-green-800 shadow-2xl bg-white dark:bg-gray-900">
          <CardContent className="pt-16 pb-16">
            <div className="text-center">
              <div className="inline-block p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6 animate-bounce shadow-2xl">
                <CheckCircle className="h-20 w-20 text-white" />
              </div>
              <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Payment Successful!
              </h2>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-3">
                Your order has been received
              </p>
              <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-6 py-3 rounded-full mb-8">
                <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                  {orderType === 'takeaway' ? '📦 Takeaway Order' : `🍽️ Table ${selectedTable}`}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Your order is being prepared by our baristas
              </p>
              <Button 
                onClick={() => navigate(`/order/${order.id}?success=true`)}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-2xl transition-all"
              >
                View Order Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Processing Screen
  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-emerald-200 dark:border-emerald-800 shadow-2xl">
          <CardContent className="pt-16 pb-16 text-center">
            <div className="inline-block p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full mb-6 animate-spin" style={{ animationDuration: '2s' }}>
              <CreditCard className="h-16 w-16 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Processing Payment...</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please wait while we process your {paymentMethod === 'cash' ? 'cash' : 'card'} payment
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 animate-pulse" style={{ width: '70%' }} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Confirmation Screen
  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-emerald-300 dark:border-emerald-700 shadow-2xl bg-white dark:bg-gray-900">
          <CardHeader className="border-b border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-gray-800 dark:to-gray-800">
            <CardTitle className="text-3xl font-black text-center text-emerald-900 dark:text-emerald-100">
              Confirm Your Order
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            {/* Order Summary */}
            <div className="mb-8 p-6 bg-emerald-50 dark:bg-gray-800 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800">
              <h3 className="text-xl font-bold mb-4 text-emerald-900 dark:text-emerald-100">Order Summary</h3>
              <div className="space-y-3">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{item.qty}x {item.menu_item.name}</span>
                    <span className="font-semibold">{(item.price_each * item.qty).toFixed(2)} EGP</span>
                  </div>
                ))}
                <div className="border-t-2 border-emerald-300 dark:border-emerald-700 pt-3 mt-3">
                  <div className="flex justify-between items-center text-xl font-bold text-emerald-900 dark:text-emerald-100">
                    <span>Total</span>
                    <span>{order.total_amount.toFixed(2)} EGP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment & Order Details */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-emerald-200 dark:border-emerald-700">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Payment Method:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  {paymentMethod === 'cash' ? <Wallet className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                  {paymentMethod === 'cash' ? 'Cash Payment' : 'Card Payment'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-emerald-200 dark:border-emerald-700">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Order Type:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  {orderType === 'takeaway' ? <PackagePlus className="h-5 w-5" /> : <Home className="h-5 w-5" />}
                  {orderType === 'takeaway' ? 'Takeaway' : 'Dine-In'}
                </span>
              </div>
              {selectedTable && (
                <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-emerald-200 dark:border-emerald-700">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Table:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">Table {selectedTable}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button 
                onClick={() => setShowConfirmation(false)}
                variant="outline"
                size="lg"
                className="flex-1 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold text-lg py-6"
              >
                <X className="h-5 w-5 mr-2" />
                Go Back
              </Button>
              <Button 
                onClick={handleFinalPayment}
                size="lg"
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-lg py-6 shadow-lg hover:shadow-2xl transition-all"
              >
                <Check className="h-5 w-5 mr-2" />
                Confirm & Pay
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Payment Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Complete Your Order
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Choose your payment method and delivery option</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Order Summary */}
          <Card className="border-2 border-emerald-200 dark:border-emerald-800 shadow-xl bg-white dark:bg-gray-900 h-fit">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <ShoppingBag className="h-6 w-6" />
                Your Order
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 pb-6">
              <div className="space-y-4 mb-6">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-emerald-50 dark:bg-gray-800 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <img 
                      src={getItemImage(item.menu_item.name, item.menu_item)}
                      alt={item.menu_item.name}
                      className="w-20 h-20 object-cover rounded-lg shadow-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x100/059669/ffffff?text=Coffee';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white truncate">{item.menu_item.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Quantity: {item.qty}</p>
                      <p className="font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                        {(item.price_each * item.qty).toFixed(2)} EGP
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-emerald-300 dark:border-emerald-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-semibold">{order.total_amount.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  <span>Total:</span>
                  <span>{order.total_amount.toFixed(2)} EGP</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Payment Options */}
          <div className="space-y-6">
            {/* Step 1: Payment Method */}
            <Card className="border-2 border-emerald-200 dark:border-emerald-800 shadow-xl bg-white dark:bg-gray-900">
              <CardHeader className="bg-emerald-50 dark:bg-gray-800 border-b border-emerald-200 dark:border-emerald-800">
                <CardTitle className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                  Step 1: Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 pb-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setPaymentMethod('cash');
                      setOrderType('dine-in'); // Cash is always dine-in
                    }}
                    className={`relative p-6 rounded-2xl border-3 transition-all duration-300 ${
                      paymentMethod === 'cash'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 shadow-xl scale-105'
                        : 'border-gray-300 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:scale-105'
                    }`}
                  >
                    {paymentMethod === 'cash' && (
                      <div className="absolute -top-3 -right-3 bg-emerald-600 text-white rounded-full p-2 shadow-lg">
                        <Check className="h-5 w-5" />
                      </div>
                    )}
                    <Wallet className={`h-12 w-12 mx-auto mb-3 ${paymentMethod === 'cash' ? 'text-emerald-600' : 'text-gray-600 dark:text-gray-400'}`} />
                    <div className={`font-bold text-lg ${paymentMethod === 'cash' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      Cash
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">Pay at table</div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`relative p-6 rounded-2xl border-3 transition-all duration-300 ${
                      paymentMethod === 'card'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 shadow-xl scale-105'
                        : 'border-gray-300 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:scale-105'
                    }`}
                  >
                    {paymentMethod === 'card' && (
                      <div className="absolute -top-3 -right-3 bg-emerald-600 text-white rounded-full p-2 shadow-lg">
                        <Check className="h-5 w-5" />
                      </div>
                    )}
                    <CreditCard className={`h-12 w-12 mx-auto mb-3 ${paymentMethod === 'card' ? 'text-emerald-600' : 'text-gray-600 dark:text-gray-400'}`} />
                    <div className={`font-bold text-lg ${paymentMethod === 'card' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      Card
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">Pay now</div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Order Type (Card only) */}
            {paymentMethod === 'card' && (
              <Card className="border-2 border-emerald-200 dark:border-emerald-800 shadow-xl bg-white dark:bg-gray-900 animate-fade-in">
                <CardHeader className="bg-emerald-50 dark:bg-gray-800 border-b border-emerald-200 dark:border-emerald-800">
                  <CardTitle className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                    Step 2: Order Type
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 pb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setOrderType('dine-in')}
                      className={`relative p-6 rounded-2xl border-3 transition-all duration-300 ${
                        orderType === 'dine-in'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 shadow-xl scale-105'
                          : 'border-gray-300 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:scale-105'
                      }`}
                    >
                      {orderType === 'dine-in' && (
                        <div className="absolute -top-3 -right-3 bg-emerald-600 text-white rounded-full p-2 shadow-lg">
                          <Check className="h-5 w-5" />
                        </div>
                      )}
                      <Store className={`h-12 w-12 mx-auto mb-3 ${orderType === 'dine-in' ? 'text-emerald-600' : 'text-gray-600 dark:text-gray-400'}`} />
                      <div className={`font-bold text-lg ${orderType === 'dine-in' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        Dine-In
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">Choose a table</div>
                    </button>

                    <button
                      onClick={() => {
                        setOrderType('takeaway');
                        setSelectedTable(''); // Clear table for takeaway
                      }}
                      className={`relative p-6 rounded-2xl border-3 transition-all duration-300 ${
                        orderType === 'takeaway'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 shadow-xl scale-105'
                          : 'border-gray-300 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:scale-105'
                      }`}
                    >
                      {orderType === 'takeaway' && (
                        <div className="absolute -top-3 -right-3 bg-emerald-600 text-white rounded-full p-2 shadow-lg">
                          <Check className="h-5 w-5" />
                        </div>
                      )}
                      <PackagePlus className={`h-12 w-12 mx-auto mb-3 ${orderType === 'takeaway' ? 'text-emerald-600' : 'text-gray-600 dark:text-gray-400'}`} />
                      <div className={`font-bold text-lg ${orderType === 'takeaway' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        Takeaway
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">To go</div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Table Selection (Cash or Dine-In) */}
            {(paymentMethod === 'cash' || orderType === 'dine-in') && (
              <Card className="border-2 border-emerald-200 dark:border-emerald-800 shadow-xl bg-white dark:bg-gray-900 animate-fade-in">
                <CardHeader className="bg-emerald-50 dark:bg-gray-800 border-b border-emerald-200 dark:border-emerald-800">
                  <CardTitle className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                    {paymentMethod === 'cash' ? 'Step 2: Select Your Table' : 'Step 3: Select Your Table'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 pb-6">
                  <div className="grid grid-cols-4 gap-3">
                    {tables.slice(0, 12).map((table: any) => (
                      <button
                        key={table.id}
                        onClick={() => setSelectedTable(table.label.replace('Table ', ''))}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                          selectedTable === table.label.replace('Table ', '')
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg scale-110'
                            : 'border-gray-300 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:scale-105 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="font-bold text-lg">{table.label.replace('Table ', '')}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Card Details (Card payment only) */}
            {paymentMethod === 'card' && (
              <Card className="border-2 border-emerald-200 dark:border-emerald-800 shadow-xl bg-white dark:bg-gray-900 animate-fade-in">
                <CardHeader className="bg-emerald-50 dark:bg-gray-800 border-b border-emerald-200 dark:border-emerald-800">
                  <CardTitle className="text-xl font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    {orderType === 'takeaway' ? 'Step 3: ' : 'Step 4: '}Card Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 pb-6 space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-semibold">
                      Cardholder Name
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="mt-2 border-2 border-gray-300 dark:border-gray-600 focus:border-emerald-500 dark:focus:border-emerald-500 h-12 text-lg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardNumber" className="text-gray-700 dark:text-gray-300 font-semibold">
                      Card Number
                    </Label>
                    <Input
                      id="cardNumber"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="mt-2 border-2 border-gray-300 dark:border-gray-600 focus:border-emerald-500 dark:focus:border-emerald-500 h-12 text-lg font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry" className="text-gray-700 dark:text-gray-300 font-semibold">
                        Expiry Date
                      </Label>
                      <Input
                        id="expiry"
                        value={expiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                          setExpiry(val);
                        }}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="mt-2 border-2 border-gray-300 dark:border-gray-600 focus:border-emerald-500 dark:focus:border-emerald-500 h-12 text-lg font-mono"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvc" className="text-gray-700 dark:text-gray-300 font-semibold">
                        CVC
                      </Label>
                      <Input
                        id="cvc"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        placeholder="123"
                        maxLength={3}
                        className="mt-2 border-2 border-gray-300 dark:border-gray-600 focus:border-emerald-500 dark:focus:border-emerald-500 h-12 text-lg font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-emerald-50 dark:bg-gray-800 p-3 rounded-lg">
                    <Lock className="h-4 w-4 text-emerald-600" />
                    <span>Your payment information is secure and encrypted</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Continue Button */}
            <div className="flex gap-4">
              <Button 
                onClick={() => navigate('/checkout')}
                variant="outline"
                size="lg"
                className="flex-1 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold text-lg h-14"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleConfirmPayment}
                disabled={!paymentMethod || (paymentMethod === 'card' && !orderType)}
                size="lg"
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xl h-14 shadow-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Confirmation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
