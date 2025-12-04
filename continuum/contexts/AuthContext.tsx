import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState, wait } from '../types';

interface AuthContextType extends AuthState {
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lazy initialization to prevent flickering of "logged out" state on refresh
  const [state, setState] = useState<AuthState>(() => {
    const storedUser = localStorage.getItem('continuum_user');
    return storedUser 
      ? { isAuthenticated: true, user: JSON.parse(storedUser) } 
      : { isAuthenticated: false, user: null };
  });

  const signIn = async (email: string) => {
    await wait(800); 
    
    // Normalize email to ensure consistent IDs regardless of case
    const normalizedEmail = email.toLowerCase().trim();
    
    // Create a consistent ID from email
    const id = btoa(normalizedEmail).substring(0, 12);
    const userId = `user_${id}`;
    
    // Attempt to restore name from existing profile if re-logging in
    let existingName = '';
    try {
      const storedProfile = localStorage.getItem(`continuum_profile_${userId}`);
      if (storedProfile) {
        const p = JSON.parse(storedProfile);
        if (p.name) existingName = p.name;
      }
    } catch (e) { /* ignore */ }
    
    const newUser = {
      id: userId,
      name: existingName, // Use existing name if found, otherwise empty until onboarding
      email: normalizedEmail
    };
    
    localStorage.setItem('continuum_user', JSON.stringify(newUser));
    setState({ isAuthenticated: true, user: newUser });
  };

  const signOut = async () => {
    await wait(400);
    localStorage.removeItem('continuum_user');
    setState({ isAuthenticated: false, user: null });
  };

  const updateUser = (name: string) => {
    if (state.user) {
      const updatedUser = { ...state.user, name };
      localStorage.setItem('continuum_user', JSON.stringify(updatedUser));
      setState(prev => ({ ...prev, user: updatedUser }));
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};