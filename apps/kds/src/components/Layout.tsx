import { ReactNode } from 'react';
import { ChefHat } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="border-b-2 border-gray-200 dark:border-gray-700 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 dark:bg-white rounded-xl shadow-lg">
              <ChefHat className="h-6 w-6 text-white dark:text-gray-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Kitchen Display System
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Order Management & Inventory</p>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-6 py-6">{children}</main>
    </div>
  );
}

