
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Capture } from './pages/Capture';
import { Profile } from './pages/Profile';
import { Chat } from './pages/Chat';
import { Onboarding } from './pages/Onboarding';
import { Button, Input } from './components/UI';
import { Logo } from './components/Logo';
import { Loader2, ArrowRight, Mail } from 'lucide-react';

const LoginScreen = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    await signIn(email);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex justify-center">
            <Logo className="w-12 h-12 shadow-lg rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Continuum</h1>
          <p className="text-gray-500">The intelligent memory platform.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                id="email"
                type="email" 
                placeholder="you@example.com" 
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full h-11" 
            disabled={isLoading || !email}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center justify-center">Continue <ArrowRight className="ml-2 w-4 h-4" /></span>}
          </Button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Secure sign-in powered by Clerk (Mock). <br/>
            By continuing, you agree to our Terms.
          </p>
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const { profile } = useStore();
  const [view, setView] = useState<'dashboard' | 'capture' | 'profile' | 'chat'>('dashboard');

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Show loading while profile is fetched from local storage
  if (profile === null) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Logo className="w-12 h-12 animate-pulse" />
        <p className="text-sm text-gray-400 font-medium">Loading Continuum...</p>
      </div>
    );
  }

  // Redirect to onboarding if not onboarded
  if (!profile.isOnboarded) {
    return <Onboarding onComplete={() => setView('dashboard')} />;
  }

  return (
    <Layout currentView={view} onChangeView={setView}>
      {view === 'dashboard' && <Dashboard onNewMemory={() => setView('capture')} />}
      {view === 'capture' && <Capture onComplete={() => setView('dashboard')} />}
      {view === 'chat' && <Chat />}
      {view === 'profile' && <Profile />}
    </Layout>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </AuthProvider>
  );
};

export default App;
