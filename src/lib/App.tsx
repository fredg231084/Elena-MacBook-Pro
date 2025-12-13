import { useState } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Users, Building2, FileText } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Suppliers from './components/Suppliers';
import Inventory from './components/Inventory';
import Sales from './components/Sales';
import Customers from './components/Customers';
import PurchaseOrders from './components/PurchaseOrders';
import { fr } from './lib/translations';

type Page = 'dashboard' | 'suppliers' | 'inventory' | 'sales' | 'customers' | 'purchase_orders';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('suppliers');
  const t = fr;

  const navigation = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'suppliers', label: t.nav.suppliers, icon: Building2 },
    { id: 'purchase_orders', label: 'Bons de commande', icon: FileText },
    { id: 'inventory', label: t.nav.inventory, icon: Package },
    { id: 'sales', label: t.nav.sales, icon: ShoppingCart },
    { id: 'customers', label: t.nav.customers, icon: Users },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'suppliers':
        return <Suppliers />;
      case 'purchase_orders':
        return <PurchaseOrders />;
      case 'inventory':
        return <Inventory />;
      case 'sales':
        return <Sales />;
      case 'customers':
        return <Customers />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-[#1a1d29] text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">UnitFlow</h1>
          <p className="text-xs text-gray-400 mt-1">Espace de travail d'Elena</p>
        </div>

        <nav className="flex-1 p-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as Page)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  currentPage === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
