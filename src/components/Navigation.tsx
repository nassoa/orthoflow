'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Correction de texte', path: '/' },
    { name: 'Lettre de motivation', path: '/lettre' },
    { name: 'Traduction', path: '/traduction' },
  ];

  return (
    <nav className="mb-8">
      <ul className="flex justify-center space-x-4">
        {menuItems.map((item) => (
          <li key={item.path}>
            <Link
              href={item.path}
              className={`px-4 py-2 rounded-md transition-colors ${
                pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
} 