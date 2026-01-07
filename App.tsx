
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { User, AuthState } from './types';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Simulate initial auth check
    const timer = setTimeout(() => {
      const savedUser = localStorage.getItem('svi_user');
      if (savedUser) {
        setAuth({
          user: JSON.parse(savedUser),
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setAuth(prev => ({ ...prev, isLoading: false }));
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const login = (email: string) => {
    const mockUser: User = {
      id: 'usr_1',
      name: email.split('@')[0],
      email: email,
      quota: {
        used: 3,
        total: 10,
        resetDate: '2026-01-14'
      },
      tier: 'free'
    };
    localStorage.setItem('svi_user', JSON.stringify(mockUser));
    setAuth({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem('svi_user');
    setAuth({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-zinc-400 text-sm font-medium animate-pulse">Initializing SVI 2.0 Pro...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!auth.isAuthenticated ? <LoginPage onLogin={login} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/*" 
          element={auth.isAuthenticated ? <DashboardPage user={auth.user!} onLogout={logout} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </HashRouter>
  );
};

export default App;
