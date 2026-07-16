'use client';

import { useState, useEffect } from 'react';
import { HiOutlineBell } from 'react-icons/hi';
import { api } from '@/lib/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count } = await api.notificaciones.noLeidas();
        setUnreadCount(count);
      } catch {
        // ignore
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-lg border-b border-dark-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-dark-400 text-sm mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-all duration-200">
            <HiOutlineBell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
