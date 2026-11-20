import React from 'react';
import { NavLink } from 'react-router-dom';
import { Film, ListOrdered, Ticket, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Navbar: React.FC = () => {
  const navItems = [
    { to: '/movies', label: 'Movies', icon: Film },
    { to: '/rewatch-plan', label: 'Rewatch Plan', icon: ListOrdered },
    { to: '/booking', label: 'Booking', icon: Ticket },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <NavLink to="/movies" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600/20 border border-red-500/30 text-red-500 group-hover:scale-105 group-hover:bg-red-600 group-hover:text-white transition-all duration-200">
              <Shield className="h-5 w-5 fill-current" />
            </div>
            <div>
              <span className="font-black text-lg tracking-wider text-white uppercase font-sans">
                Doomsday<span className="text-red-500">Ready</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono tracking-widest text-slate-400 border border-slate-800 rounded px-1.5 py-0.5 bg-slate-900">
                MCU 2027
              </span>
            </div>
          </NavLink>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-red-600/15 text-red-400 border border-red-500/30 shadow-sm shadow-red-950/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};
