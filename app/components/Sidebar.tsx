"use client"; // Обов'язково для навігації

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, LayoutDashboard, Search, Settings } from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Дашборд', href: '/', icon: LayoutDashboard },
    { name: 'Пошук оферів', href: '/search', icon: Search },
    { name: 'AI Studio', href: '/studio', icon: Sparkles, isNew: true },
  ];

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-white/10 h-screen fixed left-0 top-0 flex flex-col p-4 z-50">
      {/* LOGO */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(37,99,235,0.5)]">
          AS
        </div>
        <span className="text-xl font-bold tracking-tight text-white">Absolute <span className="text-blue-500">Spy</span></span>
      </div>

      {/* MENU */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} className={`${isActive ? 'text-blue-400' : 'group-hover:text-white'}`} />
              <span className="font-medium">{item.name}</span>
              {item.isNew && (
                <span className="ml-auto text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                  NEW
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="pt-4 border-t border-white/10 mt-auto">
        <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-white transition-colors">
          <Settings size={20} />
          <span className="text-sm">Налаштування</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;