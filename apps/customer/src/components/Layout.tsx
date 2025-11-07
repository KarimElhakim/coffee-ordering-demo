import { ReactNode, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../store/cart';
import { Button } from '@coffee-demo/ui';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [searchParams] = useSearchParams();
  const { tableId, setTableId, items, getTotal } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const table = searchParams.get('table');
    if (table) {
      setTableId(table);
    }
  }, [searchParams, setTableId]);

  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">☕ Coffee Shop</h1>
          {tableId && <p className="text-sm text-muted-foreground">Table {tableId}</p>}
          <Button
            variant="outline"
            onClick={() => navigate('/checkout')}
            className="relative"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart ({itemCount})
            {itemCount > 0 && (
              <span className="ml-2 text-sm font-semibold">
                {getTotal().toFixed(2)} EGP
              </span>
            )}
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

