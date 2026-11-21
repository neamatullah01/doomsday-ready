import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/shared/Navbar';
import { Footer } from '../components/shared/Footer';
import { ColdStartBanner } from '../components/shared/ColdStartBanner';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ColdStartBanner />
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
