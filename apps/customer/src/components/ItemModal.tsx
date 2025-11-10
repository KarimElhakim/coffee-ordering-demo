import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button, Label, Input } from '@coffee-demo/ui';
import { useCart } from '../store/cart';
import { getItemImage } from '@coffee-demo/api-client';
import type { Database } from '@coffee-demo/api-client';
import { Coffee, Milk, Plus, Minus, Sparkles, MessageSquare } from 'lucide-react';

type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  station: Database['public']['Tables']['stations']['Row'];
  modifiers: Array<{
    modifier: Database['public']['Tables']['modifiers']['Row'];
  }>;
};

type Modifier = Database['public']['Tables']['modifiers']['Row'];

interface ItemModalProps {
  item: MenuItem;
  modifiers?: Modifier[];
  onClose: () => void;
  onAdd: () => void;
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

const SYRUP_OPTIONS = [
  { value: 'Vanilla', label: 'Vanilla', price: 2 },
  { value: 'Caramel', label: 'Caramel', price: 2 },
  { value: 'Hazelnut', label: 'Hazelnut', price: 2 },
];

export function ItemModal({ item, onClose, onAdd }: ItemModalProps) {
  console.log('🛒 ItemModal rendered for item:', item.name, item);
  console.log('🛒 Item modifiers:', item.modifiers);
  
  // Check if item is out of stock
  const isOutOfStock = Boolean(item.out_of_stock || (item.track_inventory && (item.stock_quantity || 0) === 0));
  
  // Don't subscribe - use getState directly like test button
  const [size, setSize] = useState('Medium');
  const [milk, setMilk] = useState<string | null>(null);
  const [shots, setShots] = useState(0);
  const [syrups, setSyrups] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [espressoType, setEspressoType] = useState<'single' | 'double'>('single');

  const availableModifiers = item.modifiers?.map((m) => m.modifier) || [];
  console.log('🛒 Available modifiers:', availableModifiers);
  
  // If out of stock, close modal immediately
  useEffect(() => {
    if (isOutOfStock) {
      onClose();
    }
  }, [isOutOfStock, onClose]);
  
  // Always show customization options for all items
  // Espresso has special handling (single/double), so skip size for it
  const showSize = item.name !== 'Espresso';
  const showMilk = true; // Always show milk options
  const showShots = true; // Always show extra shots
  const showSyrups = true; // Always show syrups

  const calculatePrice = () => {
    let total = item.base_price;
    // Handle Espresso single/double
    if (item.name === 'Espresso') {
      if (espressoType === 'double') {
        total = 35; // Double Espresso price
      } else {
        total = 25; // Single Espresso price
      }
    }
    const sizeOption = SIZE_OPTIONS.find((o) => o.value === size);
    if (sizeOption) total += sizeOption.price;
    if (milk) {
      const milkOption = MILK_OPTIONS.find((o) => o.value === milk);
      if (milkOption) total += milkOption.price;
    }
    total += shots * 5; // 5 EGP per extra shot
    total += syrups.length * 2; // 2 EGP per syrup
    return total;
  };

  const handleAdd = () => {
    // Build options array
    const options: Array<{ key: string; value: string; price_delta: number }> = [];

    // Handle Espresso single/double
    let finalName = item.name;
    let finalPrice = item.base_price;
    if (item.name === 'Espresso') {
      if (espressoType === 'double') {
        finalName = 'Double Espresso';
        finalPrice = 35;
        options.push({ key: 'Type', value: 'Double Shot', price_delta: 10 });
      } else {
        finalName = 'Espresso';
        finalPrice = 25;
        options.push({ key: 'Type', value: 'Single Shot', price_delta: 0 });
      }
    }

    const sizeOption = SIZE_OPTIONS.find((o) => o.value === size);
    if (sizeOption && sizeOption.price !== 0) {
      options.push({ key: 'Size', value: size, price_delta: sizeOption.price });
    }

    if (milk) {
      const milkOption = MILK_OPTIONS.find((o) => o.value === milk);
      if (milkOption && milkOption.price !== 0) {
        options.push({ key: 'Milk', value: milk, price_delta: milkOption.price });
      } else if (milk) {
        options.push({ key: 'Milk', value: milk, price_delta: 0 });
      }
    }

    if (shots > 0) {
      options.push({ key: 'Extra Shots', value: `${shots}`, price_delta: shots * 5 });
    }

    syrups.forEach((syrup) => {
      options.push({ key: 'Syrups', value: syrup, price_delta: 2 });
    });

    const cartItem = {
      menu_item_id: item.id,
      name: finalName,
      base_price: finalPrice,
      options: options || [],
      note: note || undefined,
    };
    
    // EXACTLY like test button - direct and simple
    const { addItem } = useCart.getState();
    addItem(cartItem);
    
    // Open cart and close modal
    window.dispatchEvent(new CustomEvent('openCart'));
    onAdd();
  };

  console.log('🛒 ItemModal returning Dialog with open=true');
  console.log('🛒 ItemModal item:', item);
  console.log('🛒 ItemModal showSize:', showSize, 'showMilk:', showMilk);
  return (
    <Dialog open={true} onOpenChange={(open) => {
      console.log('🛒 Dialog onOpenChange called with:', open);
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent 
        className="!max-w-2xl !w-[90vw] !max-h-[95vh] overflow-y-auto !bg-white !dark:!bg-gray-900 !border-2 !border-gray-300 !dark:!border-gray-600 !rounded-xl !p-8"
        style={{ 
          backgroundColor: 'white',
          color: 'black',
          zIndex: 1000,
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        onPointerDownOutside={(e) => {
          e.preventDefault();
          onClose();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        <DialogHeader className="text-center mb-6">
          <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {item.name}
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600 dark:text-gray-400 mb-4">
            Customize your order and add to cart
          </DialogDescription>
          {/* Item Image */}
          <div className="relative w-full h-48 rounded-xl overflow-hidden mx-auto mb-6 shadow-lg">
            <img 
              src={getItemImage(item.name, item)} 
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400/000000/ffffff?text=' + encodeURIComponent(item.name);
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-white dark:via-gray-900/20 dark:to-gray-900"></div>
          </div>
        </DialogHeader>
        <div className="space-y-6 px-2">
          {item.name === 'Espresso' && (
            <div>
              <Label className="text-base font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2 mb-2">
                <Coffee className="h-4 w-4" />
                Espresso Type
              </Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Button
                  variant={espressoType === 'single' ? 'default' : 'outline'}
                  onClick={() => setEspressoType('single')}
                  className={`flex-1 border-2 py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${espressoType === 'single' ? 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 border-gray-900 dark:border-white shadow-lg' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <span className="font-semibold">Single Shot (25 EGP)</span>
                </Button>
                <Button
                  variant={espressoType === 'double' ? 'default' : 'outline'}
                  onClick={() => setEspressoType('double')}
                  className={`flex-1 border-2 py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${espressoType === 'double' ? 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 border-gray-900 dark:border-white shadow-lg' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <span className="font-semibold">Double Shot (35 EGP)</span>
                </Button>
              </div>
            </div>
          )}
          {showSize && item.name !== 'Espresso' && (
            <div>
              <Label className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4" />
                Size
              </Label>
              <div className="flex gap-3 mt-2">
                {SIZE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={size === option.value ? 'default' : 'outline'}
                    onClick={() => setSize(option.value)}
                    className={`flex-1 border-2 py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${size === option.value ? 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 border-gray-900 dark:border-white shadow-lg' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <span className="font-semibold">{option.label}</span>
                    {option.price > 0 && <span className="ml-1 text-xs">(+{option.price} EGP)</span>}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {showMilk && (
            <div>
              <Label className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <Milk className="h-4 w-4" />
                Milk (optional)
              </Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {MILK_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={milk === option.value ? 'default' : 'outline'}
                    onClick={() => setMilk(milk === option.value ? null : option.value)}
                    className={`border-2 py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${milk === option.value ? 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 border-gray-900 dark:border-white shadow-lg' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <span className="font-semibold">{option.label}</span>
                    {option.price > 0 && <span className="ml-1 text-xs">(+{option.price} EGP)</span>}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {showShots && (
            <div>
              <Label className="text-base font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2 mb-2">
                <Coffee className="h-4 w-4" />
                Extra Shots (+5 EGP each)
              </Label>
              <div className="flex items-center justify-center gap-4 mt-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShots(Math.max(0, shots - 1))}
                  className="border-2 border-gray-300 dark:border-gray-700 w-12 h-12 rounded-lg flex items-center justify-center p-0 transition-all duration-200 hover:scale-110 active:scale-95 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={shots === 0}
                >
                  <Minus className="h-5 w-5 transition-transform duration-200" />
                </Button>
                <span className="text-2xl font-bold text-gray-900 dark:text-white w-16 text-center transition-all duration-200">{shots}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShots(shots + 1)}
                  className="border-2 border-gray-300 dark:border-gray-700 w-12 h-12 rounded-lg flex items-center justify-center p-0 transition-all duration-200 hover:scale-110 active:scale-95 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Plus className="h-5 w-5 transition-transform duration-200" />
                </Button>
              </div>
            </div>
          )}

          {showSyrups && (
            <div>
              <Label className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4" />
                Syrups (+2 EGP each)
              </Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {SYRUP_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={syrups.includes(option.value) ? 'default' : 'outline'}
                    onClick={() => {
                      if (syrups.includes(option.value)) {
                        setSyrups(syrups.filter((s) => s !== option.value));
                      } else {
                        setSyrups([...syrups, option.value]);
                      }
                    }}
                    className={`border-2 py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${syrups.includes(option.value) ? 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 border-gray-900 dark:border-white shadow-lg' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <span className="font-semibold">{option.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="note" className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4" />
              Special Instructions (optional)
            </Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., extra hot, no foam..."
              className="mt-2 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 transition-all duration-200 focus:border-gray-900 dark:focus:border-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-2 hover:border-gray-400 dark:hover:border-gray-600"
            />
          </div>

          <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6 mt-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">Total:</span>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {calculatePrice().toFixed(2)} EGP
              </span>
            </div>
            <div className="flex justify-center">
              <Button
                type="button"
                className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold shadow-lg py-4 px-8 text-lg rounded-lg inline-flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-xl"
                onClick={handleAdd}
              >
                <Plus className="h-5 w-5 mr-2 transition-transform duration-200 group-hover:scale-110" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

