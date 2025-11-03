'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

export default function DesktopNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const links = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/inbox', label: 'Inbox', icon: '📬' },
    { href: '/admin/compose', label: 'Brain Dump', icon: '🧠' },
    { href: '/admin/classify', label: 'Classify', icon: '⚠️' },
    { href: '/admin/rules', label: 'Rules', icon: '📜' },
    { href: '/admin/search', label: 'Search', icon: '🔍' },
    { href: '/admin/sessions', label: 'Sessions', icon: '📝' },
    { href: '/admin/agents', label: 'Agents', icon: '🤖' },
    { href: '/admin/activity', label: 'Activity', icon: '🔴' },
    { href: '/admin/capture', label: 'Capture', icon: '✏️' },
    { href: '/admin/install', label: 'Install', icon: '⬇️' },
  ]

  return (
    <nav className="hidden md:block fixed top-0 left-0 right-0 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href="/admin/dashboard" className="text-xl font-bold text-gray-900 dark:text-white">
            Fernando
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-lg">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {session?.user?.name || 'User'}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
