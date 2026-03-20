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
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-[260px] bg-surface-container-low border-r border-outline-variant/10 z-40 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold font-[family-name:var(--font-family-display)] text-on-surface tracking-tight">
              WorkSpace
            </h1>
            <p className="text-[0.625rem] text-on-surface-variant uppercase tracking-[0.1em] font-medium">
              Premium Curator
            </p>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 mt-2">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary-container/20 text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <item.icon
                    size={19}
                    className={`transition-colors ${
                      isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'
                    }`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 space-y-1 border-t border-outline-variant/10 pt-3">
          {bottomItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all"
            >
              <item.icon size={19} />
              {item.label}
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}
