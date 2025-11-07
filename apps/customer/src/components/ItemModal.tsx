import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, Label, Input } from '@coffee-demo/ui';
import { useCart } from '../store/cart';
import type { Database } from '@coffee-demo/api-client';

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
  const { addItem } = useCart();
  const [size, setSize] = useState('Medium');
  const [milk, setMilk] = useState<string | null>(null);
  const [shots, setShots] = useState(0);
  const [syrups, setSyrups] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const availableModifiers = item.modifiers.map((m) => m.modifier);

  const calculatePrice = () => {
    let total = item.base_price;
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
    const options: Array<{ key: string; value: string; price_delta: number }> = [];

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

    addItem({
      menu_item_id: item.id,
      name: item.name,
      base_price: item.base_price,
      options,
      note: note || undefined,
    });

    onAdd();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {availableModifiers.some((m) => m.name === 'Size') && (
            <div>
              <Label>Size</Label>
              <div className="flex gap-2 mt-2">
                {SIZE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={size === option.value ? 'default' : 'outline'}
                    onClick={() => setSize(option.value)}
                    className="flex-1"
                  >
                    {option.label}
                    {option.price > 0 && ` (+${option.price} EGP)`}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {availableModifiers.some((m) => m.name === 'Milk') && (
            <div>
              <Label>Milk</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {MILK_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={milk === option.value ? 'default' : 'outline'}
                    onClick={() => setMilk(option.value)}
                  >
                    {option.label}
                    {option.price > 0 && ` (+${option.price} EGP)`}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {availableModifiers.some((m) => m.name === 'Extra Shots') && (
            <div>
              <Label>Extra Shots (+5 EGP each)</Label>
              <div className="flex items-center gap-4 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setShots(Math.max(0, shots - 1))}
                >
                  -
                </Button>
                <span className="text-lg font-semibold">{shots}</span>
                <Button
                  variant="outline"
                  onClick={() => setShots(shots + 1)}
                >
                  +
                </Button>
              </div>
            </div>
          )}

          {availableModifiers.some((m) => m.name === 'Syrups') && (
            <div>
              <Label>Syrups (+2 EGP each)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
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
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="note">Special Instructions (optional)</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., extra hot, no foam..."
              className="mt-2"
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold">{calculatePrice().toFixed(2)} EGP</span>
            </div>
            <Button className="w-full" onClick={handleAdd}>
              Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

