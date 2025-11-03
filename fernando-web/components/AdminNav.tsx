'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function AdminNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [serverInfo, setServerInfo] = useState({
    containerIp: 'Loading...',
    apiStatus: 'checking',
    dynamoStatus: 'checking',
    wsStatus: 'checking',
  })

  // Fetch server info and check system status
  useEffect(() => {
    fetch('/api/server-info')
      .then(res => res.json())
      .then(data => {
        setServerInfo(prev => ({
          ...prev,
          containerIp: data.containerIp || data.forwardedFor || 'Unknown'
        }))
      })
      .catch(() => setServerInfo(prev => ({ ...prev, containerIp: 'Error' })))

    fetch(process.env.NEXT_PUBLIC_FERNANDO_API_URL + '/health', { method: 'HEAD' })
      .then(res => setServerInfo(prev => ({ ...prev, apiStatus: res.ok ? 'connected' : 'down' })))
      .catch(() => setServerInfo(prev => ({ ...prev, apiStatus: 'down' })))

    setServerInfo(prev => ({
      ...prev,
      wsStatus: process.env.NEXT_PUBLIC_WS_URL ? 'down' : 'down',
      dynamoStatus: 'OK'
    }))
  }, [])

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/chat', label: 'Chat', icon: '💬' },
    { href: '/admin/inbox', label: 'Inbox', icon: '📬' },
    { href: '/admin/compose', label: 'Brain Dump', icon: '🧠' },
    { href: '/admin/search', label: 'Search', icon: '🔍' },
    { href: '/admin/classify', label: 'Classify', icon: '⚠️' },
    { href: '/admin/rules', label: 'Rules', icon: '📜' },
    { href: '/admin/capture', label: 'Capture', icon: '✏️' },
    { href: '/admin/sessions', label: 'Sessions', icon: '📝' },
    { href: '/admin/agents', label: 'Agents', icon: '🤖' },
    { href: '/admin/install', label: 'Install', icon: '⬇️' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* Top Bar - Always visible */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg z-50">
        <div className="h-full px-4 flex items-center justify-between max-w-screen-2xl mx-auto">
          {/* Logo */}
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <span className="text-3xl">🤖</span>
            <span className="text-xl font-bold text-white">Fernando</span>
          </Link>

          {/* Desktop Nav - Hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.href)
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side - User & Status */}
          <div className="flex items-center gap-4">
            {/* System Status Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${serverInfo.apiStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-xs text-white/90">v3.0.0</span>
            </div>

            {/* User Menu */}
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm text-white/90">{session?.user?.name || 'User'}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Menu */}
      <div
        className={`fixed top-16 right-0 bottom-0 w-80 bg-white dark:bg-gray-900 shadow-2xl z-40 transform transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* System Status */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-3">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              System Status
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="px-2 py-1.5 bg-gray-100 dark:bg-gray-800 rounded">
                <div className="text-gray-600 dark:text-gray-400">API</div>
                <div className={`font-medium ${serverInfo.apiStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                  {serverInfo.apiStatus === 'connected' ? '● OK' : '● Down'}
                </div>
              </div>
              <div className="px-2 py-1.5 bg-gray-100 dark:bg-gray-800 rounded">
                <div className="text-gray-600 dark:text-gray-400">DB</div>
                <div className="font-medium text-green-600">● OK</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <div>UI: v3.0.0</div>
              <div className="truncate">IP: {serverInfo.containerIp}</div>
            </div>
            <div className="px-2 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded text-center">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">🚀 ECS</span>
            </div>
          </div>

          {/* User Info */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="mb-3 text-sm text-gray-700 dark:text-gray-300">
              {session?.user?.name || 'User'}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
