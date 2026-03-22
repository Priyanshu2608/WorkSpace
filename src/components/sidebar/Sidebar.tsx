'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  StickyNote,
  Pencil,
  Settings,
  HelpCircle,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/projects', icon: FolderOpen, label: 'Projects' },
  { href: '/tasks', icon: CheckSquare, label: 'My Tasks' },
  { href: '/notes', icon: StickyNote, label: 'Personal Notes' },
  { href: '/wireframes', icon: Pencil, label: 'Wireframes' },
];

const bottomItems = [
  { href: '#', icon: Settings, label: 'Settings' },
  { href: '#', icon: HelpCircle, label: 'Support' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-container-high text-on-surface lg:hidden hover:bg-surface-bright transition-colors"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-surface-dim/70 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-[260px] bg-[#f2fbfa] border-r border-[#c4e8e1] z-40 flex flex-col transition-transform duration-300 lg:translate-x-0 shadow-md ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-7 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-info flex items-center justify-center shadow-sm">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold font-[family-name:var(--font-family-display)] text-on-surface tracking-tight">
              WorkSpace
            </h1>
            <p className="text-[0.6875rem] text-on-surface-variant/80 uppercase tracking-widest font-semibold">
              Premium Planner
            </p>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-4 mt-4">
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[0.9375rem] font-semibold transition-all duration-300 group ${
                    isActive
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <item.icon
                    size={20}
                    className={`transition-transform duration-300 ${
                      isActive ? 'text-primary scale-110' : 'text-on-surface-variant/70 group-hover:text-primary group-hover:scale-110'
                    }`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="px-4 pb-6 space-y-1.5 border-t border-outline-variant/20 pt-4">
          {bottomItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-[0.9375rem] font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all duration-300 group"
            >
              <item.icon size={20} className="text-on-surface-variant/70 group-hover:text-on-surface transition-transform duration-300 group-hover:scale-110" />
              {item.label}
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}
