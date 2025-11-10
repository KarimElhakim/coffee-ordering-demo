import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button, Label, Input } from '@coffee-demo/ui';
import { getItemImage } from '@coffee-demo/api-client';
import type { Database } from '@coffee-demo/api-client';
import { Coffee, Milk, Plus, Minus, Sparkles, MessageSquare } from 'lucide-react';

type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  station: Database['public']['Tables']['stations']['Row'];
  modifiers?: Array<{
    modifier: Database['public']['Tables']['modifiers']['Row'];
  }>;
};

interface ItemModalProps {
  item: MenuItem;
  onClose: () => void;
  onAdd: (item: {
    menu_item_id: string;
    name: string;
    base_price: number;
    options: Array<{ key: string; value: string; price_delta: number }>;
    note?: string;
    image_url?: string;
    local_image_path?: string;
    category?: string;
  }) => void;
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
  const [size, setSize] = useState('Medium');
  const [milk, setMilk] = useState<string | null>(null);
  const [shots, setShots] = useState(0);
  const [syrups, setSyrups] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [espressoType, setEspressoType] = useState<'single' | 'double'>('single');

  // Always show customization options for all items
  const showSize = item.name !== 'Espresso';
  const showMilk = true;
  const showShots = true;
  const showSyrups = true;

  const calculatePrice = () => {
    let total = item.base_price;
    // Handle Espresso single/double
    if (item.name === 'Espresso') {
      if (espressoType === 'double') {
        total = 35;
      } else {
        total = 25;
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

    onAdd({
      menu_item_id: item.id,
      name: finalName,
      base_price: finalPrice,
      options: options || [],
      note: note || undefined,
      // Include image data for proper display
      image_url: (item as any).image_url,
      local_image_path: (item as any).local_image_path,
      category: (item as any).category,
    });
    
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(open) => {
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
        <DialogHeader className="!text-center mb-6 flex flex-col items-center w-full">
          <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-2 !text-center w-full">
            {item.name}
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600 dark:text-gray-400 mb-4 !text-center w-full">
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
        <div className="space-y-6 px-2 w-full">
          {item.name === 'Espresso' && (
            <div className="w-full">
              <Label className="text-base font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2 mb-2 w-full">
                <Coffee className="h-4 w-4" />
                <span>Espresso Type</span>
              </Label>
              <div className="grid grid-cols-2 gap-3 mt-2 w-full">
                <Button
                  variant={espressoType === 'single' ? 'default' : 'outline'}
                  onClick={() => setEspressoType('single')}
                  className={`flex-1 border-2 py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center ${espressoType === 'single' ? 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 border-gray-900 dark:border-white shadow-lg' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <span className="font-semibold text-center">Single Shot (25 EGP)</span>
                </Button>
                <Button
                  variant={espressoType === 'double' ? 'default' : 'outline'}
                  onClick={() => setEspressoType('double')}
                  className={`flex-1 border-2 py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center ${espressoType === 'double' ? 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 border-gray-900 dark:border-white shadow-lg' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <span className="font-semibold text-center">Double Shot (35 EGP)</span>
                </Button>
              </div>
            </div>
          )}
          {showSize && item.name !== 'Espresso' && (
            <div className="w-full">
              <Label className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2 w-full">
                <Sparkles className="h-4 w-4" />
                <span>Size</span>
              </Label>
              <div className="flex gap-3 mt-2 w-full">
                {SIZE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={size === option.value ? 'default' : 'outline'}
                    onClick={() => setSize(option.value)}
                    className={`flex-1 border-2 py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center ${size === option.value ? 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 border-gray-900 dark:border-white shadow-lg' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <span className="font-semibold text-center">{option.label}</span>
                    {option.price > 0 && <span className="ml-1 text-xs">(+{option.price} EGP)</span>}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {showMilk && (
            <div className="w-full">
              <Label className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2 w-full">
                <Milk className="h-4 w-4" />
                <span>Milk (optional)</span>
              </Label>
              <div className="grid grid-cols-2 gap-3 mt-2 w-full">
                {MILK_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={milk === option.value ? 'default' : 'outline'}
                    onClick={() => setMilk(milk === option.value ? null : option.value)}
                    className={`border-2 py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center ${milk === option.value ? 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 border-gray-900 dark:border-white shadow-lg' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <span className="font-semibold text-center">{option.label}</span>
                    {option.price > 0 && <span className="ml-1 text-xs">(+{option.price} EGP)</span>}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {showShots && (
            <div className="w-full">
              <Label className="text-base font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2 mb-2 w-full">
                <Coffee className="h-4 w-4" />
                <span>Extra Shots (+5 EGP each)</span>
              </Label>
              <div className="flex items-center justify-center gap-4 mt-2 w-full">
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
            <div className="w-full">
              <Label className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2 w-full">
                <Sparkles className="h-4 w-4" />
                <span>Syrups (+2 EGP each)</span>
              </Label>
              <div className="grid grid-cols-2 gap-3 mt-2 w-full">
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
                    className={`border-2 py-3 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center ${syrups.includes(option.value) ? 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 border-gray-900 dark:border-white shadow-lg' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <span className="font-semibold text-center">{option.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="w-full">
            <Label htmlFor="note" className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2 w-full">
              <MessageSquare className="h-4 w-4" />
              <span>Special Instructions (optional)</span>
            </Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., extra hot, no foam..."
              className="mt-2 w-full border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 transition-all duration-200 focus:border-gray-900 dark:focus:border-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-2 hover:border-gray-400 dark:hover:border-gray-600"
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
                Add to Order
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
