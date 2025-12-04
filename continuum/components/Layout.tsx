
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  User, 
  LogOut, 
  Menu,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Button } from './UI';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  currentView: 'dashboard' | 'capture' | 'profile' | 'chat';
  onChangeView: (view: 'dashboard' | 'capture' | 'profile' | 'chat') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView }) => {
  const { user, signOut } = useAuth();
  const { profile } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Use profile name if available (more reliable), fallback to auth user name
  const displayName = profile?.name || user?.name || 'User';
  const displayEmail = user?.email || '';

  const NavItem = ({ view, icon: Icon, label }: { view: 'dashboard' | 'capture' | 'profile' | 'chat', icon: any, label: string }) => (
    <button
      onClick={() => {
        onChangeView(view);
        setMobileMenuOpen(false);
      }}
      className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
        currentView === view 
          ? 'bg-gray-100 text-gray-900' 
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      <Icon className={`w-4 h-4 mr-3 ${currentView === view ? 'text-gray-900' : 'text-gray-400'}`} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-gray-200 bg-white fixed h-full z-10">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <Logo className="w-8 h-8" />
          <span className="font-bold text-lg tracking-tight text-gray-900">Continuum</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="capture" icon={PlusCircle} label="New Memory" />
          <NavItem view="chat" icon={MessageSquare} label="Ask Continuum" />
          <NavItem view="profile" icon={User} label="My Profile" />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 uppercase">
              {displayName.charAt(0)}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={signOut} icon={LogOut} className="w-full justify-start text-gray-500 hover:text-red-600">
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <Logo className="w-6 h-6" />
          <span className="font-bold text-lg text-gray-900">Continuum</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-500">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-10 pt-20 px-4 pb-6 flex flex-col">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="capture" icon={PlusCircle} label="New Memory" />
          <NavItem view="chat" icon={MessageSquare} label="Ask Continuum" />
          <NavItem view="profile" icon={User} label="My Profile" />
          <div className="mt-auto pt-6 border-t border-gray-100">
             <div className="flex items-center mb-4 px-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 uppercase">
                  {displayName.charAt(0)}
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
                </div>
              </div>
             <Button variant="ghost" onClick={signOut} icon={LogOut} className="w-full justify-start">
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-20 md:pt-0 p-6 md:p-10 max-w-7xl mx-auto w-full">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
