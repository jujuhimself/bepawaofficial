import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar'; // Assuming Navbar is your main navigation component
import ChatBot from './ChatBot';

const AppLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // Optional: add a global loading spinner here
    return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <ChatBot />
    </div>
  );
};

export default AppLayout;

