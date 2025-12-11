import { useState } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Users, Building2 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Suppliers from './components/Suppliers';
import Inventory from './components/Inventory';
import Sales from './components/Sales';
import Customers from './components/Customers';

type Page = 'dashboard' | 'suppliers' | 'inventory' | 'sales' | 'customers';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'suppliers', label: 'Suppliers', icon: Building2 },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sales', label: 'Sales', icon: ShoppingCart },
    { id: 'customers', label: 'Customers', icon: Users },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'suppliers':
        return <Suppliers />;
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
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold">MacBook Depot</h1>
          <p className="text-sm text-gray-400 mt-1">Inventory Management</p>
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
