import { useEffect, useState } from 'react';
import { getMenuItems, getItemImage } from '@coffee-demo/api-client';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@coffee-demo/ui';
import { Package, AlertTriangle, Edit, Save, X, Plus, Minus } from 'lucide-react';
import type { Database } from '@coffee-demo/api-client';

type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  station: Database['public']['Tables']['stations']['Row'];
};

export function InventoryManagement() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [stockInput, setStockInput] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const menuItems = await getMenuItems();
      setItems(menuItems as MenuItem[]);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (item: MenuItem) => {
    setEditingItem(item.id);
    setStockInput({ ...stockInput, [item.id]: item.stock_quantity || 0 });
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setStockInput({});
  };

  const handleSaveStock = async (item: MenuItem) => {
    const newStock = stockInput[item.id];
    if (newStock === undefined || newStock < 0) {
      alert('Please enter a valid stock quantity');
      return;
    }

    try {
      // Update via API (we'll add this to the API client)
      const response = await fetch('/api/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_item_id: item.id,
          stock_quantity: newStock,
          out_of_stock: newStock <= 0,
        }),
      });

      if (!response.ok) {
        // Fallback to demo mode (localStorage)
        const demoItems = JSON.parse(localStorage.getItem('demo-menu-items') || '[]');
        const updatedItems = demoItems.map((i: any) =>
          i.id === item.id ? { ...i, stock_quantity: newStock, out_of_stock: newStock <= 0 } : i
        );
        localStorage.setItem('demo-menu-items', JSON.stringify(updatedItems));
      }

      await loadInventory();
      setEditingItem(null);
      setStockInput({});
    } catch (error) {
      console.error('Failed to update stock:', error);
      alert('Failed to update stock');
    }
  };

  const handleQuickAdjust = (item: MenuItem, adjustment: number) => {
    const currentStock = item.stock_quantity || 0;
    const newStock = Math.max(0, currentStock + adjustment);
    setStockInput({ ...stockInput, [item.id]: newStock });
  };

  const getStockStatus = (item: MenuItem) => {
    const stock = item.stock_quantity || 0;
    const threshold = item.low_stock_threshold || 10;

    if (item.out_of_stock || stock === 0) {
      return { label: 'Out of Stock', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', dotColor: 'bg-red-600 dark:bg-red-400' };
    } else if (stock <= threshold) {
      return { label: 'Low Stock', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', dotColor: 'bg-yellow-600 dark:bg-yellow-400' };
    } else {
      return { label: 'In Stock', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30', dotColor: 'bg-green-600 dark:bg-green-400' };
    }
  };

  const lowStockItems = items.filter(item => {
    const stock = item.stock_quantity || 0;
    const threshold = item.low_stock_threshold || 10;
    return item.out_of_stock || stock <= threshold;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{items.length}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
              {lowStockItems.filter(i => !i.out_of_stock && (i.stock_quantity || 0) > 0).length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-900 dark:text-red-100">
              {items.filter(i => i.out_of_stock || (i.stock_quantity || 0) === 0).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card className="border-2 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="h-6 w-6" />
            Inventory Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item) => {
              const status = getStockStatus(item);
              const isEditing = editingItem === item.id;
              const currentStock = isEditing ? (stockInput[item.id] ?? item.stock_quantity ?? 0) : (item.stock_quantity ?? 0);

              return (
                <div
                  key={item.id}
                  className={`border-2 rounded-xl p-4 transition-all duration-200 ${
                    status.label === 'Out of Stock'
                      ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                      : status.label === 'Low Stock'
                      ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Item Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                      <img
                        src={getItemImage(item.name)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://via.placeholder.com/100x100/000000/ffffff?text=' +
                            encodeURIComponent(item.name.substring(0, 2));
                        }}
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.station.name}
                      </p>
                    </div>

                    {/* Stock Status */}
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-lg ${status.bgColor} flex items-center gap-2`}>
                        <div className={`w-2 h-2 rounded-full ${status.dotColor}`}></div>
                        <span className={`text-xs font-semibold ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {/* Stock Quantity */}
                    <div className="flex items-center gap-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickAdjust(item, -10)}
                            className="h-8 w-8 p-0 rounded-lg border-2"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            value={currentStock}
                            onChange={(e) =>
                              setStockInput({ ...stockInput, [item.id]: parseInt(e.target.value) || 0 })
                            }
                            className="w-20 text-center font-bold border-2 rounded-lg"
                            min="0"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickAdjust(item, 10)}
                            className="h-8 w-8 p-0 rounded-lg border-2"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center min-w-[60px]">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {currentStock}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">in stock</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            onClick={() => handleSaveStock(item)}
                            className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="border-2 border-gray-300 dark:border-gray-700 rounded-lg"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => handleStartEdit(item)}
                          variant="outline"
                          className="border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:border-gray-400 dark:hover:border-gray-600"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

