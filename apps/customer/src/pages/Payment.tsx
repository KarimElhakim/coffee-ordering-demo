import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrders, markOrderPaid, getItemImage, getTables } from '@coffee-demo/api-client';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@coffee-demo/ui';
import { CheckCircle, CreditCard, Lock, ArrowLeft, ShoppingBag, Wallet, Store, PackagePlus, Home, Check, X, Sparkles } from 'lucide-react';
import { useCart } from '../store/cart';

export function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const clearCart = useCart((state) => state.clearCart);
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
      
      // Clear cart after successful payment
      clearCart();
      
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
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-2 border-gray-900 dark:border-white shadow-2xl">
          <CardContent className="pt-12 pb-12 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-900 dark:text-white mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Order not found</h2>
            <Button 
              onClick={() => navigate('/')}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-semibold"
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
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-4 border-black dark:border-white shadow-2xl bg-white dark:bg-black animate-fade-in">
          <CardContent className="pt-20 pb-20">
            <div className="text-center">
              <div className="inline-block p-8 bg-black dark:bg-white rounded-full mb-8 animate-bounce shadow-2xl">
                <CheckCircle className="h-24 w-24 text-white dark:text-black" />
              </div>
              <h2 className="text-6xl font-black mb-6 text-black dark:text-white animate-fade-in-up">
                Payment Complete!
              </h2>
              <p className="text-2xl text-gray-700 dark:text-gray-300 mb-4 font-medium animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Your order is being prepared
              </p>
              <div className="inline-flex items-center gap-3 bg-gray-100 dark:bg-gray-900 px-8 py-4 rounded-2xl mb-10 border-2 border-gray-900 dark:border-white animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <span className="text-lg font-bold text-black dark:text-white">
                  {orderType === 'takeaway' ? 'Takeaway Order' : `Table ${selectedTable}`}
                </span>
              </div>
              <Button 
                onClick={() => navigate(`/order/${order.id}?success=true`)}
                size="lg"
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-bold text-xl px-10 py-7 rounded-2xl shadow-2xl hover:scale-105 transition-all animate-fade-in-up"
                style={{ animationDelay: '0.6s' }}
              >
                <Sparkles className="h-6 w-6 mr-2" />
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
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-4 border-black dark:border-white shadow-2xl">
          <CardContent className="pt-16 pb-16 text-center">
            <div className="inline-block p-8 bg-black dark:bg-white rounded-full mb-8 animate-spin" style={{ animationDuration: '3s' }}>
              <CreditCard className="h-20 w-20 text-white dark:text-black" />
            </div>
            <h2 className="text-4xl font-black mb-6 text-black dark:text-white">Processing Payment</h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
              Securely processing your {paymentMethod === 'cash' ? 'cash' : 'card'} payment
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
              <div className="h-full bg-black dark:bg-white animate-pulse" style={{ width: '70%' }} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Confirmation Screen
  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 animate-fade-in">
        <Card className="max-w-3xl w-full border-4 border-black dark:border-white shadow-2xl bg-white dark:bg-black">
          <CardHeader className="border-b-4 border-black dark:border-white bg-gray-100 dark:bg-gray-900 pb-8 pt-8">
            <CardTitle className="text-4xl font-black text-center text-black dark:text-white">
              Confirm Your Order
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-10 pb-10">
            {/* Order Summary */}
            <div className="mb-10 p-8 bg-gray-50 dark:bg-gray-900 rounded-3xl border-3 border-gray-900 dark:border-white">
              <h3 className="text-2xl font-black mb-6 text-black dark:text-white">Order Summary</h3>
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center text-lg">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{item.qty}x {item.menu_item.name}</span>
                    <span className="font-black text-black dark:text-white">{(item.price_each * item.qty).toFixed(2)} EGP</span>
                  </div>
                ))}
                <div className="border-t-4 border-black dark:border-white pt-4 mt-6">
                  <div className="flex justify-between items-center text-3xl font-black">
                    <span className="text-black dark:text-white">Total</span>
                    <span className="text-black dark:text-white">{order.total_amount.toFixed(2)} EGP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-5 mb-10">
              <div className="flex items-center justify-between p-6 bg-white dark:bg-black rounded-2xl border-3 border-black dark:border-white shadow-lg">
                <span className="font-bold text-xl text-gray-900 dark:text-gray-100">Payment Method</span>
                <span className="font-black text-2xl text-black dark:text-white flex items-center gap-3">
                  {paymentMethod === 'cash' ? <Wallet className="h-7 w-7" /> : <CreditCard className="h-7 w-7" />}
                  {paymentMethod === 'cash' ? 'Cash' : 'Card'}
                </span>
              </div>
              <div className="flex items-center justify-between p-6 bg-white dark:bg-black rounded-2xl border-3 border-black dark:border-white shadow-lg">
                <span className="font-bold text-xl text-gray-900 dark:text-gray-100">Order Type</span>
                <span className="font-black text-2xl text-black dark:text-white flex items-center gap-3">
                  {orderType === 'takeaway' ? <PackagePlus className="h-7 w-7" /> : <Home className="h-7 w-7" />}
                  {orderType === 'takeaway' ? 'Takeaway' : 'Dine-In'}
                </span>
              </div>
              {selectedTable && (
                <div className="flex items-center justify-between p-6 bg-white dark:bg-black rounded-2xl border-3 border-black dark:border-white shadow-lg animate-fade-in">
                  <span className="font-bold text-xl text-gray-900 dark:text-gray-100">Table Number</span>
                  <span className="font-black text-3xl text-black dark:text-white">#{selectedTable}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-6">
              <Button 
                onClick={() => setShowConfirmation(false)}
                variant="outline"
                size="lg"
                className="flex-1 border-4 border-gray-900 dark:border-white hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-black font-bold text-xl py-8 transition-all hover:scale-105"
              >
                <X className="h-6 w-6 mr-2" />
                Go Back
              </Button>
              <Button 
                onClick={handleFinalPayment}
                size="lg"
                className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-black text-xl py-8 shadow-2xl hover:shadow-black/50 dark:hover:shadow-white/50 transition-all hover:scale-110 animate-pulse"
              >
                <Check className="h-6 w-6 mr-3" />
                Confirm & Pay {order.total_amount.toFixed(2)} EGP
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Payment Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-black dark:via-gray-950 dark:to-black py-4 md:py-8 px-3 md:px-4 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        {/* Header with Animation */}
        <div className="text-center mb-6 md:mb-10 animate-fade-in-down">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-3 md:mb-4 text-gray-900 dark:text-white tracking-tight">
            Complete <span className="bg-gradient-to-r from-gray-700 to-black dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Your Order</span>
          </h1>
          <p className="text-base md:text-xl text-gray-600 dark:text-gray-400 font-medium px-4 md:px-0">Secure payment in just a few steps</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
          {/* Left: Order Summary */}
          <Card className="border-2 md:border-4 border-black dark:border-white shadow-xl md:shadow-2xl bg-white dark:bg-black h-fit animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="bg-black dark:bg-white pb-4 md:pb-6 pt-4 md:pt-6">
              <CardTitle className="text-xl md:text-2xl lg:text-3xl font-black flex items-center gap-2 md:gap-3 text-white dark:text-black">
                <ShoppingBag className="h-6 w-6 md:h-8 md:w-8" />
                Your Order
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 md:pt-8 pb-4 md:pb-8">
              <div className="space-y-3 md:space-y-5 mb-6 md:mb-8">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex gap-3 md:gap-5 p-3 md:p-5 bg-gray-50 dark:bg-gray-900 rounded-xl md:rounded-2xl border-2 border-gray-900 dark:border-white hover:scale-105 transition-transform">
                    <img 
                      src={getItemImage(item.menu_item.name, item.menu_item)}
                      alt={item.menu_item.name}
                      className="w-16 h-16 md:w-24 md:h-24 object-cover rounded-lg md:rounded-xl shadow-lg border-2 border-black dark:border-white flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x100/000000/ffffff?text=Coffee';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-base md:text-lg text-black dark:text-white truncate mb-1 md:mb-2">{item.menu_item.name}</h4>
                      <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-semibold">Quantity: {item.qty}</p>
                      <p className="font-black text-lg md:text-xl text-black dark:text-white mt-1 md:mt-2">
                        {(item.price_each * item.qty).toFixed(2)} EGP
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-4 border-black dark:border-white pt-6 mt-6">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">Subtotal</span>
                  <span className="text-2xl font-black text-black dark:text-white">{order.total_amount.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between items-center mt-6 p-6 bg-black dark:bg-white rounded-2xl">
                  <span className="text-3xl font-black text-white dark:text-black">TOTAL</span>
                  <span className="text-4xl font-black text-white dark:text-black">{order.total_amount.toFixed(2)} EGP</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Payment Options */}
          <div className="space-y-8">
            {/* Step 1: Payment Method */}
            <Card className="border-4 border-black dark:border-white shadow-2xl bg-white dark:bg-black animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="bg-gray-900 dark:bg-gray-100 pb-6 pt-6 border-b-4 border-black dark:border-white">
                <CardTitle className="text-2xl font-black text-white dark:text-black">
                  Step 1: Choose Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 pb-8">
                <div className="grid grid-cols-2 gap-6">
                  <button
                    onClick={() => {
                      setPaymentMethod('cash');
                      setOrderType('dine-in');
                    }}
                    className={`relative p-8 rounded-3xl border-4 transition-all duration-300 group ${
                      paymentMethod === 'cash'
                        ? 'border-black dark:border-white bg-black dark:bg-white shadow-2xl scale-110'
                        : 'border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white hover:scale-105 hover:shadow-xl'
                    }`}
                  >
                    {paymentMethod === 'cash' && (
                      <div className="absolute -top-4 -right-4 bg-black dark:bg-white text-white dark:text-black rounded-full p-3 shadow-2xl animate-bounce">
                        <Check className="h-6 w-6" />
                      </div>
                    )}
                    <Wallet className={`h-16 w-16 mx-auto mb-4 ${paymentMethod === 'cash' ? 'text-white dark:text-black' : 'text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                    <div className={`font-black text-2xl ${paymentMethod === 'cash' ? 'text-white dark:text-black' : 'text-gray-900 dark:text-white'}`}>
                      Cash
                    </div>
                    <div className={`text-sm font-semibold mt-2 ${paymentMethod === 'cash' ? 'text-gray-300 dark:text-gray-700' : 'text-gray-500'}`}>
                      Pay at table
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`relative p-8 rounded-3xl border-4 transition-all duration-300 group ${
                      paymentMethod === 'card'
                        ? 'border-black dark:border-white bg-black dark:bg-white shadow-2xl scale-110'
                        : 'border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white hover:scale-105 hover:shadow-xl'
                    }`}
                  >
                    {paymentMethod === 'card' && (
                      <div className="absolute -top-4 -right-4 bg-black dark:bg-white text-white dark:text-black rounded-full p-3 shadow-2xl animate-bounce">
                        <Check className="h-6 w-6" />
                      </div>
                    )}
                    <CreditCard className={`h-16 w-16 mx-auto mb-4 ${paymentMethod === 'card' ? 'text-white dark:text-black' : 'text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                    <div className={`font-black text-2xl ${paymentMethod === 'card' ? 'text-white dark:text-black' : 'text-gray-900 dark:text-white'}`}>
                      Card
                    </div>
                    <div className={`text-sm font-semibold mt-2 ${paymentMethod === 'card' ? 'text-gray-300 dark:text-gray-700' : 'text-gray-500'}`}>
                      Pay securely now
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Order Type (Card only) */}
            {paymentMethod === 'card' && (
              <Card className="border-4 border-black dark:border-white shadow-2xl bg-white dark:bg-black animate-fade-in">
                <CardHeader className="bg-gray-900 dark:bg-gray-100 pb-6 pt-6 border-b-4 border-black dark:border-white">
                  <CardTitle className="text-2xl font-black text-white dark:text-black">
                    Step 2: Order Type
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 pb-8">
                  <div className="grid grid-cols-2 gap-6">
                    <button
                      onClick={() => setOrderType('dine-in')}
                      className={`relative p-8 rounded-3xl border-4 transition-all duration-300 group ${
                        orderType === 'dine-in'
                          ? 'border-black dark:border-white bg-black dark:bg-white shadow-2xl scale-110'
                          : 'border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white hover:scale-105 hover:shadow-xl'
                      }`}
                    >
                      {orderType === 'dine-in' && (
                        <div className="absolute -top-4 -right-4 bg-black dark:bg-white text-white dark:text-black rounded-full p-3 shadow-2xl animate-bounce">
                          <Check className="h-6 w-6" />
                        </div>
                      )}
                      <Store className={`h-16 w-16 mx-auto mb-4 ${orderType === 'dine-in' ? 'text-white dark:text-black' : 'text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                      <div className={`font-black text-2xl ${orderType === 'dine-in' ? 'text-white dark:text-black' : 'text-gray-900 dark:text-white'}`}>
                        Dine-In
                      </div>
                      <div className={`text-sm font-semibold mt-2 ${orderType === 'dine-in' ? 'text-gray-300 dark:text-gray-700' : 'text-gray-500'}`}>
                        Enjoy in café
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setOrderType('takeaway');
                        setSelectedTable('');
                      }}
                      className={`relative p-8 rounded-3xl border-4 transition-all duration-300 group ${
                        orderType === 'takeaway'
                          ? 'border-black dark:border-white bg-black dark:bg-white shadow-2xl scale-110'
                          : 'border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white hover:scale-105 hover:shadow-xl'
                      }`}
                    >
                      {orderType === 'takeaway' && (
                        <div className="absolute -top-4 -right-4 bg-black dark:bg-white text-white dark:text-black rounded-full p-3 shadow-2xl animate-bounce">
                          <Check className="h-6 w-6" />
                        </div>
                      )}
                      <PackagePlus className={`h-16 w-16 mx-auto mb-4 ${orderType === 'takeaway' ? 'text-white dark:text-black' : 'text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                      <div className={`font-black text-2xl ${orderType === 'takeaway' ? 'text-white dark:text-black' : 'text-gray-900 dark:text-white'}`}>
                        Takeaway
                      </div>
                      <div className={`text-sm font-semibold mt-2 ${orderType === 'takeaway' ? 'text-gray-300 dark:text-gray-700' : 'text-gray-500'}`}>
                        To go
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Table Selection */}
            {(paymentMethod === 'cash' || orderType === 'dine-in') && (
              <Card className="border-4 border-black dark:border-white shadow-2xl bg-white dark:bg-black animate-fade-in">
                <CardHeader className="bg-gray-900 dark:bg-gray-100 pb-6 pt-6 border-b-4 border-black dark:border-white">
                  <CardTitle className="text-2xl font-black text-white dark:text-black">
                    {paymentMethod === 'cash' ? 'Step 2' : 'Step 3'}: Select Table
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 pb-8">
                  <div className="grid grid-cols-4 gap-4">
                    {tables.slice(0, 12).map((table: any) => (
                      <button
                        key={table.id}
                        onClick={() => setSelectedTable(table.label.replace('Table ', ''))}
                        className={`relative p-6 rounded-2xl border-3 transition-all duration-200 font-black text-2xl ${
                          selectedTable === table.label.replace('Table ', '')
                            ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-2xl scale-125'
                            : 'border-gray-400 dark:border-gray-600 hover:border-black dark:hover:border-white hover:scale-110 bg-white dark:bg-black text-gray-900 dark:text-white hover:shadow-xl'
                        }`}
                      >
                        {table.label.replace('Table ', '')}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Card Details */}
            {paymentMethod === 'card' && (
              <Card className="border-4 border-black dark:border-white shadow-2xl bg-white dark:bg-black animate-fade-in">
                <CardHeader className="bg-gray-900 dark:bg-gray-100 pb-6 pt-6 border-b-4 border-black dark:border-white">
                  <CardTitle className="text-2xl font-black text-white dark:text-black flex items-center gap-3">
                    <Lock className="h-7 w-7" />
                    {orderType === 'takeaway' ? 'Step 3' : 'Step 4'}: Card Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 pb-8 space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-black dark:text-white font-black text-lg mb-3 block">
                      Cardholder Name
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="border-3 border-gray-900 dark:border-white focus:border-black dark:focus:border-white h-14 text-lg font-semibold bg-white dark:bg-black rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardNumber" className="text-black dark:text-white font-black text-lg mb-3 block">
                      Card Number
                    </Label>
                    <Input
                      id="cardNumber"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="border-3 border-gray-900 dark:border-white focus:border-black dark:focus:border-white h-14 text-lg font-mono bg-white dark:bg-black rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="expiry" className="text-black dark:text-white font-black text-lg mb-3 block">
                        Expiry
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
                        className="border-3 border-gray-900 dark:border-white focus:border-black dark:focus:border-white h-14 text-lg font-mono bg-white dark:bg-black rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvc" className="text-black dark:text-white font-black text-lg mb-3 block">
                        CVC
                      </Label>
                      <Input
                        id="cvc"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        placeholder="123"
                        maxLength={3}
                        className="border-3 border-gray-900 dark:border-white focus:border-black dark:focus:border-white h-14 text-lg font-mono bg-white dark:bg-black rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm font-semibold bg-gray-100 dark:bg-gray-900 p-5 rounded-2xl border-2 border-gray-900 dark:border-white">
                    <Lock className="h-5 w-5 text-black dark:text-white" />
                    <span className="text-black dark:text-white">Secure 256-bit encrypted payment</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Continue Button */}
            <div className="flex gap-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Button 
                onClick={() => navigate('/checkout')}
                variant="outline"
                size="lg"
                className="flex-1 border-4 border-gray-900 dark:border-white hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-black font-bold text-xl h-16 transition-all hover:scale-105"
              >
                <ArrowLeft className="h-6 w-6 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleConfirmPayment}
                disabled={!paymentMethod || (paymentMethod === 'card' && !orderType)}
                size="lg"
                className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-black text-xl h-16 shadow-2xl hover:shadow-black/50 dark:hover:shadow-white/50 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Sparkles className="h-6 w-6 mr-3 animate-pulse" />
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
