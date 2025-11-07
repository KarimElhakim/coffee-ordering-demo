import { ReactNode } from 'react';
import { CreditCard } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden">
      <header className="border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 backdrop-blur-md z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-900 dark:bg-white rounded-lg shadow-lg">
              <CreditCard className="h-6 w-6 text-white dark:text-gray-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Cashier Console
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Staff POS System</p>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 overflow-x-hidden">{children}</main>
    </div>
  );
}

