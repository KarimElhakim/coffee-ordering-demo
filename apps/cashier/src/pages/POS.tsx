import { useEffect, useState } from 'react';
import { getMenuItems, createOrder, markOrderPaid } from '@coffee-demo/api-client';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@coffee-demo/ui';
import { Search, Plus, Minus, Trash2, CreditCard, DollarSign } from 'lucide-react';
import type { Database } from '@coffee-demo/api-client';

type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  station: Database['public']['Tables']['stations']['Row'];
};

interface CartItem {
  menu_item_id: string;
  name: string;
  base_price: number;
  qty: number;
  options: Array<{ key: string; value: string; price_delta: number }>;
  note?: string;
}

const SIZE_OPTIONS = [
  { value: 'Small', label: 'Small (S)', price: 0 },
  { value: 'Medium', label: 'Medium (M)', price: 5 },
  { value: 'Large', label: 'Large (L)', price: 10 },
];

const MILK_OPTIONS = [
  { value: 'Whole Milk', label: 'Whole Milk', price: 0 },
  { value: 'Skim Milk', label: 'Skim Milk', price: 0 },
  { value: 'Oat Milk', label: 'Oat Milk', price: 3 },
  { value: 'Almond Milk', label: 'Almond Milk', price: 3 },
];

export function POS() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [size, setSize] = useState('Medium');
  const [milk, setMilk] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [tableId, setTableId] = useState('');
  const [loading, setLoading] = useState(false);

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
  }, []);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (item: MenuItem) => {
    const options: Array<{ key: string; value: string; price_delta: number }> = [];
    const sizeOption = SIZE_OPTIONS.find((o) => o.value === size);
    if (sizeOption && sizeOption.price !== 0) {
      options.push({ key: 'Size', value: size, price_delta: sizeOption.price });
    }
    if (milk) {
      const milkOption = MILK_OPTIONS.find((o) => o.value === milk);
      if (milkOption && milkOption.price !== 0) {
        options.push({ key: 'Milk', value: milk, price_delta: milkOption.price });
      } else {
        options.push({ key: 'Milk', value: milk, price_delta: 0 });
      }
    }

    const existing = cart.find(
      (c) => c.menu_item_id === item.id && JSON.stringify(c.options) === JSON.stringify(options)
    );
    if (existing) {
      setCart(cart.map((c) => (c === existing ? { ...c, qty: c.qty + 1 } : c)));
    } else {
      setCart([...cart, { menu_item_id: item.id, name: item.name, base_price: item.base_price, qty: 1, options }]);
    }
    setSelectedItem(null);
    setSize('Medium');
    setMilk(null);
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

  const getSubtotal = () => {
    return cart.reduce((sum, item) => {
      const itemPrice = item.base_price + item.options.reduce((s, opt) => s + opt.price_delta, 0);
      return sum + itemPrice * item.qty;
    }, 0);
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    return subtotal * (1 - discount / 100);
  };

  const handleCheckout = async (paymentMethod: 'cash' | 'card_present_demo') => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
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
        })),
        total_amount: getTotal(),
      });

      await markOrderPaid(order.id, paymentMethod, getTotal());
      alert(`Order #${order.id.slice(0, 8)} created and marked as paid!`);
      setCart([]);
      setTableId('');
      setDiscount(0);
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{item.base_price.toFixed(2)} EGP</p>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => setSelectedItem(item)}>
                  Add
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="table">Table (optional)</Label>
              <Input
                id="table"
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                placeholder="Table number"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="mt-2"
              />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cart.map((item, index) => {
                const itemPrice = item.base_price + item.options.reduce((sum, opt) => sum + opt.price_delta, 0);
                return (
                  <div key={index} className="border rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        {item.options.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {item.options.map((opt) => `${opt.key}: ${opt.value}`).join(', ')}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFromCart(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(index, item.qty - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span>{item.qty}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(index, item.qty + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="font-semibold">{(itemPrice * item.qty).toFixed(2)} EGP</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {cart.length > 0 && (
              <>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{getSubtotal().toFixed(2)} EGP</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({discount}%)</span>
                      <span>-{(getSubtotal() * discount / 100).toFixed(2)} EGP</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span>{getTotal().toFixed(2)} EGP</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleCheckout('cash')}
                    disabled={loading}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Cash
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleCheckout('card_present_demo')}
                    disabled={loading}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Card
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle>{selectedItem.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Size</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label} {opt.price > 0 && `(+${opt.price} EGP)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Milk (optional)</Label>
                <Select value={milk || ''} onValueChange={(v) => setMilk(v || null)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select milk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {MILK_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label} {opt.price > 0 && `(+${opt.price} EGP)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedItem(null)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={() => addToCart(selectedItem)}>
                  Add to Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

