import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMenuItems, getModifiers, type Database } from '@coffee-demo/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@coffee-demo/ui';
import { ItemModal } from '../components/ItemModal';

type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  station: Database['public']['Tables']['stations']['Row'];
  modifiers: Array<{
    modifier: Database['public']['Tables']['modifiers']['Row'];
  }>;
};

export function Menu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [modifiers, setModifiers] = useState<Database['public']['Tables']['modifiers']['Row'][]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [menuItems, allModifiers] = await Promise.all([
          getMenuItems(),
          getModifiers(),
        ]);
        setItems(menuItems as MenuItem[]);
        setModifiers(allModifiers);
      } catch (error) {
        console.error('Failed to load menu:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading menu...</div>;
  }

  const groupedByStation = items.reduce((acc, item) => {
    const stationName = item.station?.name || 'Other';
    if (!acc[stationName]) acc[stationName] = [];
    acc[stationName].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Menu</h2>
      {Object.entries(groupedByStation).map(([station, stationItems]) => (
        <div key={station} className="mb-12">
          <h3 className="text-2xl font-semibold mb-4">{station}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stationItems.map((item) => (
              <Card key={item.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription>
                    {item.base_price.toFixed(2)} EGP
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => setSelectedItem(item)}
                  >
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          modifiers={modifiers}
          onClose={() => setSelectedItem(null)}
          onAdd={() => {
            setSelectedItem(null);
            navigate('/checkout');
          }}
        />
      )}
    </div>
  );
}

