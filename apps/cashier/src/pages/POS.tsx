import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMenuItems, createOrder, markOrderPaid, getItemImage } from '@coffee-demo/api-client';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@coffee-demo/ui';
import { Search, Plus, Minus, CreditCard, DollarSign, ShoppingBag, Percent, Hash, Receipt, CheckCircle, Package, X } from 'lucide-react';
import type { Database } from '@coffee-demo/api-client';
import { ItemModal } from '../components/ItemModal';
import { CustomerDetailsModal } from '../components/CustomerDetailsModal';

type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  station: Database['public']['Tables']['stations']['Row'];
  modifiers?: Array<{
    modifier: Database['public']['Tables']['modifiers']['Row'];
  }>;
};

interface CartItem {
  menu_item_id: string;
  name: string;
  base_price: number;
  qty: number;
  options: Array<{ key: string; value: string; price_delta: number }>;
  note?: string;
}

export function POS() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [discount, setDiscount] = useState(0);
  const [tableId, setTableId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<'cash' | 'card_present_demo' | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const menuItems = await getMenuItems();
        setItems(menuItems as MenuItem[]);
      } catch (error) {
        console.error('Failed to load menu:', error);
      }
    }
    load();

    // Listen for order created events (for external notifications)
    const handleOrderCreated = () => {
      // Note: Success overlay is now handled directly in handleCheckout
    };
    window.addEventListener('orderCreated', handleOrderCreated);
    return () => window.removeEventListener('orderCreated', handleOrderCreated);
  }, []);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (cartItem: {
    menu_item_id: string;
    name: string;
    base_price: number;
    options: Array<{ key: string; value: string; price_delta: number }>;
    note?: string;
    image_url?: string;
    local_image_path?: string;
    category?: string;
  }) => {
    const existing = cart.find(
      (c) => c.menu_item_id === cartItem.menu_item_id && JSON.stringify(c.options) === JSON.stringify(cartItem.options)
    );
    if (existing) {
      setCart(cart.map((c) => (c === existing ? { ...c, qty: c.qty + 1 } : c)));
    } else {
      setCart([...cart, { ...cartItem, qty: 1 }]);
    }
    setSelectedItem(null);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(index);
      return;
    }
    setCart(cart.map((c, i) => (i === index ? { ...c, qty } : c)));
  };

  const [total, setTotal] = useState(0);
  const [subtotal, setSubtotal] = useState(0);

  // Recalculate totals when cart or discount changes
  useEffect(() => {
    const newSubtotal = cart.reduce((sum, item) => {
      const itemPrice = item.base_price + item.options.reduce((s, opt) => s + opt.price_delta, 0);
      return sum + itemPrice * item.qty;
    }, 0);
    setSubtotal(newSubtotal);
    setTotal(newSubtotal * (1 - discount / 100));
  }, [cart, discount]);

  const handleCheckout = (paymentMethod: 'cash' | 'card_present_demo') => {
    if (cart.length === 0) return;
    
    // Show customer details modal first
    setPendingPaymentMethod(paymentMethod);
    setShowCustomerModal(true);
  };

  const handleCustomerDetailsSubmit = async (customerDetails: { phone: string; email?: string; name?: string }) => {
    if (!pendingPaymentMethod) return;
    
    setShowCustomerModal(false);
    setLoading(true);
    
    try {
      // Calculate financial breakdown
      const calculatedSubtotal = subtotal;
      const calculatedDiscountAmount = discount > 0 ? subtotal * (discount / 100) : 0;
      const calculatedTaxAmount = calculatedSubtotal * 0.14; // 14% VAT
      
      // Generate receipt number
      const receiptNumber = `RCP-${Date.now()}`;
      
      const order = await createOrder({
        store_id: '1',
        table_id: tableId || null,
        channel: 'cashier',
        items: cart.map((item) => ({
          menu_item_id: item.menu_item_id,
          qty: item.qty,
          price_each: item.base_price + item.options.reduce((sum, opt) => sum + opt.price_delta, 0),
          note: item.note,
          options: item.options,
          product_name: item.name, // Snapshot of product name
        })),
        total_amount: total,
        // Financial breakdown
        subtotal: calculatedSubtotal,
        tax_amount: calculatedTaxAmount,
        discount_amount: calculatedDiscountAmount,
        discount_percentage: discount,
        // Operational fields
        terminal_id: 'POS-001', // Default terminal ID
        customer_name: customerDetails.name || (tableId ? `Table ${tableId}` : undefined),
        customer_phone: customerDetails.phone,
        customer_email: customerDetails.email,
        // Transaction tracking
        receipt_number: receiptNumber,
        payment_method: pendingPaymentMethod,
        // Location
        location: 'cashier',
      });

      if (pendingPaymentMethod === 'cash') {
        // For cash: mark as paid immediately and show success overlay
        await markOrderPaid(order.id, pendingPaymentMethod, total);
        
        // Show success notification
        const successEvent = new CustomEvent('orderCreated', { 
          detail: { 
            orderId: order.id, 
            total: total,
            paymentMethod: pendingPaymentMethod 
          } 
        });
        window.dispatchEvent(successEvent);
        
        // Show success overlay with order number (use order_number from database)
        setOrderNumber(order.order_number || order.id);
        setShowSuccess(true);
        
        // Reset after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
          setOrderNumber(null);
          setCart([]);
          setTableId('');
          setDiscount(0);
        }, 3000);
      } else {
        // For card: navigate to payment page (mimic customer experience)
        navigate(`/payment/${order.id}`);
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
      setPendingPaymentMethod(null);
    }
  };

  return (
    <div className="relative">
      {/* Success Overlay with Animated Checkmark */}
      {showSuccess && orderNumber && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 shadow-2xl border-[3px] border-green-500 dark:border-green-400 max-w-md w-full mx-4 flex flex-col items-center justify-center animate-scale-in">
            {/* Animated Checkmark */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-green-500 dark:bg-green-400 flex items-center justify-center animate-bounce-in">
                <CheckCircle className="h-16 w-16 text-white animate-checkmark" strokeWidth={3} />
              </div>
              {/* Ripple effect */}
              <div className="absolute inset-0 rounded-full bg-green-500/30 dark:bg-green-400/30 animate-ping"></div>
            </div>
            
            {/* Success Message */}
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center">
              Order Created!
            </h2>
            
            {/* Order Number */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-6 py-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 text-center">Order Number</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white text-center font-mono">
                {orderNumber.includes('ORD-') ? orderNumber : `#${orderNumber.slice(0, 8).toUpperCase()}`}
              </p>
            </div>
            
            {/* Total Amount */}
            <p className="text-lg text-gray-700 dark:text-gray-300 text-center">
              Total: <span className="font-bold text-gray-900 dark:text-white">{total.toFixed(2)} EGP</span>
            </p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600 dark:text-gray-400 transition-colors duration-200" />
            <Input
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-[3px] border-gray-200 dark:border-gray-700 focus:border-gray-900 dark:focus:border-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-2 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200 rounded-xl"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredItems.map((item) => {
            const isOutOfStock = Boolean(item.out_of_stock || (item.track_inventory && (item.stock_quantity || 0) === 0));
            const isLowStock = !isOutOfStock && Boolean(item.track_inventory && (item.stock_quantity || 0) <= (item.low_stock_threshold || 10) && (item.stock_quantity || 0) > 0);
            return (
            <Card 
              key={item.id} 
              className={`${isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95 hover:border-gray-400 dark:hover:border-gray-600'} hover:shadow-2xl transition-all duration-200 border-[3px] ${isOutOfStock ? 'border-red-300 dark:border-red-700' : isLowStock ? 'border-yellow-300 dark:border-yellow-700' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-900 overflow-hidden group rounded-3xl`}
            >
              <div className="relative w-full h-[200px] overflow-hidden rounded-t-3xl flex items-center justify-center">
                <img 
                  src={getItemImage(item.name, item)} 
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400/000000/ffffff?text=' + encodeURIComponent(item.name);
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-white dark:via-gray-900/20 dark:to-gray-900"></div>
                <div className="absolute top-3 right-3 bg-white/95 dark:bg-gray-900/95 rounded-full px-2 py-1 shadow-lg">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{item.base_price.toFixed(0)} EGP</span>
                </div>
              </div>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">{item.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-3 pb-3">
                <Button 
                  className={`w-full ${isOutOfStock ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100'} text-white ${isOutOfStock ? '' : 'dark:text-gray-900'} font-semibold shadow-lg text-xs py-2 rounded-xl transition-all duration-200 ${!isOutOfStock ? 'hover:scale-105 active:scale-95 hover:shadow-xl' : ''} flex items-center justify-center`}
                  onClick={() => !isOutOfStock && setSelectedItem(item)}
                  disabled={isOutOfStock}
                >
                  {isOutOfStock ? (
                    <>
                      <X className="h-3 w-3 mr-1" />
                      <span>Out of Stock</span>
                    </>
                  ) : (
                    <>
                  <Plus className="h-3 w-3 mr-1" />
                  <span>Add</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            );
          })}
        </div>
      </div>
      <div className="lg:col-span-1">
        <Card className="sticky top-24 border-[3px] border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl rounded-3xl">
          <CardHeader className="border-b-[3px] border-gray-200 dark:border-gray-700 pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-gray-900 dark:bg-white rounded-lg">
                <ShoppingBag className="h-5 w-5 text-white dark:text-gray-900" />
              </div>
              <span>Order</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="table" className="text-gray-900 dark:text-white flex items-center gap-2 text-xs font-semibold mb-1">
                  <Hash className="h-3 w-3" />
                  Table
                </Label>
                <Input
                  id="table"
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                  placeholder="Table #"
                  className="mt-1 border-[3px] border-gray-200 dark:border-gray-700 focus:border-gray-900 dark:focus:border-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-2 hover:border-gray-400 dark:hover:border-gray-600 text-sm rounded-xl transition-all duration-200"
                />
              </div>
              <div>
                <Label htmlFor="discount" className="text-gray-900 dark:text-white flex items-center gap-2 text-xs font-semibold mb-1">
                  <Percent className="h-3 w-3" />
                  Discount
                </Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="%"
                  className="mt-1 border-[3px] border-gray-200 dark:border-gray-700 focus:border-gray-900 dark:focus:border-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-2 hover:border-gray-400 dark:hover:border-gray-600 text-sm rounded-xl transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 text-xs border-[3px] border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:scale-105 active:scale-95 transition-all duration-200 rounded-xl flex items-center justify-center"
                onClick={() => {
                  setTableId('');
                  setDiscount(0);
                  setCart([]);
                }}
                disabled={cart.length === 0}
              >
                <Receipt className="h-3.5 w-3.5 mr-1.5" />
                <span>New Order</span>
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-xs border-[3px] border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:scale-105 active:scale-95 transition-all duration-200 rounded-xl flex items-center justify-center gap-1.5"
                onClick={() => {
                  // Quick discount presets
                  if (discount === 0) {
                    setDiscount(10);
                  } else if (discount === 10) {
                    setDiscount(20);
                  } else {
                    setDiscount(0);
                  }
                }}
              >
                <Percent className="h-3.5 w-3.5" />
                <span>{discount > 0 ? `${discount}%` : 'Discount'}</span>
              </Button>
            </div>
            {cart.length > 0 && (
              <div className="pt-2 border-t-[3px] border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                  Quick Actions:
                </div>
                <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-[3px] border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:scale-105 active:scale-95 transition-all duration-200 rounded-xl flex items-center justify-center gap-1.5"
                  onClick={() => {
                    // Double all quantities
                    setCart(cart.map(item => ({ ...item, qty: item.qty * 2 })));
                  }}
                >
                  <Package className="h-3.5 w-3.5" />
                  <span>Double All</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-[3px] border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:scale-105 active:scale-95 transition-all duration-200 rounded-xl flex items-center justify-center gap-1.5"
                  onClick={() => {
                    // Clear cart
                    setCart([]);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Clear</span>
                </Button>
                </div>
              </div>
            )}
            <div className="space-y-3 max-h-64 overflow-y-auto overflow-x-hidden">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4 inline-block">
                    <ShoppingBag className="h-8 w-8 mx-auto opacity-50" />
                  </div>
                  <p className="text-sm font-semibold">Cart is empty</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Add items to get started</p>
                </div>
              ) : (
                cart.map((item, index) => {
                  const itemPrice = item.base_price + item.options.reduce((sum, opt) => sum + opt.price_delta, 0);
                  return (
                    <div key={index} className="border-[3px] border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200">
                      <div className="flex gap-4">
                                   <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border-2 border-gray-900 dark:border-white">
                                     <img
                                       src={getItemImage(item.name, item)}
                                       alt={item.name}
                                       className="w-full h-full object-cover"
                                       onError={(e) => {
                                         (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x100/000000/ffffff?text=' + encodeURIComponent(item.name.substring(0, 2));
                                       }}
                                     />
                                   </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.name}</p>
                              {item.options.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {item.options.map((opt, optIdx) => (
                                    <span
                                      key={optIdx}
                                      className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-medium"
                                    >
                                      {opt.key}: {opt.value}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button 
                              onClick={() => removeFromCart(index)}
                              className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 h-7 w-7 flex-shrink-0 transition-all duration-200 hover:scale-110 active:scale-95 rounded-lg flex items-center justify-center"
                              aria-label="Remove item"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg px-1">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantity(index, item.qty - 1)}
                                className="border-[3px] border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 h-7 w-7 transition-all duration-200 hover:scale-110 active:scale-95 rounded-lg"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </Button>
                              <span className="font-bold text-xs text-gray-900 dark:text-white w-6 text-center">{item.qty}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantity(index, item.qty + 1)}
                                className="border-[3px] border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 h-7 w-7 transition-all duration-200 hover:scale-110 active:scale-95 rounded-lg"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <span className="font-bold text-sm text-gray-900 dark:text-white">{(itemPrice * item.qty).toFixed(0)} EGP</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {cart.length > 0 && (
              <>
                <div className="border-t-[3px] border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-900 dark:text-white">
                    <span className="font-semibold">Subtotal</span>
                    <span className="font-semibold">{subtotal.toFixed(2)} EGP</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Discount ({discount}%)</span>
                      <span className="font-semibold">-{(subtotal * discount / 100).toFixed(2)} EGP</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold border-t-[3px] border-gray-200 dark:border-gray-700 pt-2">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-gray-900 dark:text-white">
                      {total.toFixed(2)} EGP
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="flex-1 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-xl rounded-xl flex items-center justify-center gap-2"
                      onClick={() => handleCheckout('cash')}
                      disabled={loading}
                    >
                      <DollarSign className="h-4 w-4" />
                      <span>Cash</span>
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white font-semibold shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-xl rounded-xl flex items-center justify-center gap-2"
                      onClick={() => handleCheckout('card_present_demo')}
                      disabled={loading}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Card</span>
                    </Button>
                  </div>
                  <div className="text-xs text-center text-gray-600 dark:text-gray-400 pt-2 border-t-[3px] border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-center gap-4">
                      <span>Items: {cart.reduce((sum, item) => sum + item.qty, 0)}</span>
                      <span>•</span>
                      <span>Total: {total.toFixed(2)} EGP</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdd={addToCart}
        />
      )}
      {showCustomerModal && pendingPaymentMethod && (
        <CustomerDetailsModal
          open={showCustomerModal}
          onClose={() => {
            setShowCustomerModal(false);
            setPendingPaymentMethod(null);
          }}
          onSubmit={handleCustomerDetailsSubmit}
          paymentMethod={pendingPaymentMethod}
          total={total}
        />
      )}
      </div>
    </div>
  );
}

