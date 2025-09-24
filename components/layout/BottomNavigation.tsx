'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavigationItem {
  href: string;
  icon: string;
  label: string;
  isActive?: boolean;
}

interface BottomNavigationProps {
  isVisible?: boolean;
}

export default function BottomNavigation({ isVisible = true }: BottomNavigationProps) {
  const pathname = usePathname();

  const navigationItems: NavigationItem[] = [
    {
      href: '/',
      icon: '🏠',
      label: '홈',
      isActive: pathname === '/'
    },
    {
      href: '/dashboard',
      icon: '📊',
      label: '나의 식단',
      isActive: pathname === '/dashboard'
    }
  ];

  if (!isVisible) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50 safe-area-pb">
      <div className="flex justify-around max-w-md mx-auto">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex flex-col items-center py-2 px-4 rounded-lg transition-all duration-200
              ${item.isActive 
                ? 'text-emerald-600 bg-emerald-50' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className={`text-xs ${item.isActive ? 'font-medium' : ''}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
