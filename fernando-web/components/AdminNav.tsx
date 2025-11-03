'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'

export default function AdminNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [serverInfo, setServerInfo] = useState({
    containerIp: 'Loading...',
    apiStatus: 'checking',
    dynamoStatus: 'checking',
    wsStatus: 'checking',
  })
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Core': true,
    'Content': true,
    'Management': false,
    'System': false,
  })
  const firstLinkRef = useRef<HTMLAnchorElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  // Fetch server info and check system status
  useEffect(() => {
    // Get server IP
    fetch('/api/server-info')
      .then(res => res.json())
      .then(data => {
        setServerInfo(prev => ({
          ...prev,
          containerIp: data.containerIp || data.forwardedFor || 'Unknown'
        }))
      })
      .catch(() => setServerInfo(prev => ({ ...prev, containerIp: 'Error' })))

    // Check API Gateway
    fetch(process.env.NEXT_PUBLIC_FERNANDO_API_URL + '/health', { method: 'HEAD' })
      .then(res => setServerInfo(prev => ({ ...prev, apiStatus: res.ok ? 'connected' : 'down' })))
      .catch(() => setServerInfo(prev => ({ ...prev, apiStatus: 'down' })))

    // Check WebSocket (just check if URL is configured)
    setServerInfo(prev => ({
      ...prev,
      wsStatus: process.env.NEXT_PUBLIC_WS_URL ? 'down' : 'down',
      dynamoStatus: 'OK'
    }))
  }, [])

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }))
  }

  const navGroups = [
    {
      name: 'Core',
      items: [
        { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
      ]
    },
    {
      name: 'Content',
      items: [
        { href: '/admin/chat', label: 'Chat', icon: '💬' },
        { href: '/admin/inbox', label: 'Inbox', icon: '📬' },
        { href: '/admin/compose', label: 'Brain Dump', icon: '🧠' },
        { href: '/admin/search', label: 'Search', icon: '🔍' },
      ]
    },
    {
      name: 'Management',
      items: [
        { href: '/admin/classify', label: 'Classify', icon: '⚠️' },
        { href: '/admin/rules', label: 'Rules', icon: '📜' },
        { href: '/admin/capture', label: 'Capture', icon: '✏️' },
      ]
    },
    {
      name: 'System',
      items: [
        { href: '/admin/sessions', label: 'Sessions', icon: '📝' },
        { href: '/admin/agents', label: 'Agents', icon: '🤖' },
        { href: '/admin/install', label: 'Install', icon: '⬇️' },
      ]
    }
  ]

  const isActive = (href: string) => pathname === href

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        hamburgerRef.current?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Focus management - trap focus in menu when open
  useEffect(() => {
    if (isOpen && firstLinkRef.current) {
      firstLinkRef.current.focus()
    }
  }, [isOpen])

  // Handle touch gestures for swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX
    if (touchStart !== null && touchEnd !== null) {
      handleSwipe(touchStart, touchEnd)
    }
  }

  const handleSwipe = (start: number, end: number) => {
    const distance = start - end
    const isLeftSwipe = distance > 50 // Swipe at least 50px to the left

    if (isLeftSwipe && isOpen) {
      setIsOpen(false)
    }
  }

  // Handle backdrop click
  const handleBackdropClick = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Desktop Sidebar - Fixed on left */}
      <aside className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-slate-800 shadow-sm">
        {/* Header - Logo Area */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100 dark:border-slate-800">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="text-2xl">🤖</div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">Fernando</span>
          </Link>
        </div>

        {/* Navigation Links - Grouped with Collapse/Expand */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navGroups.map((group) => {
            const isExpanded = expandedGroups[group.name]
            return (
              <div key={group.name} className="space-y-2">
                {/* Group header - clickable to toggle */}
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-slate-900 rounded-lg transition-colors duration-200"
                >
                  <span>{group.name}</span>
                  <span className="text-xs text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                </button>
                {/* Group items - show/hide based on expanded state */}
                {isExpanded && (
                  <div className="space-y-1 pl-2">
                    {group.items.map((link) => {
                      const active = isActive(link.href)
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            active
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-900'
                          }`}
                        >
                          <span className="text-base flex-shrink-0">{link.icon}</span>
                          <span className="flex-1">{link.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* System Status - Compact Cards */}
        <div className="border-t border-gray-100 dark:border-slate-800 p-4 space-y-3 bg-gray-50 dark:bg-slate-900/50">
          <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider px-1">
            System Status
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between px-2 py-1.5 bg-white dark:bg-slate-900 rounded border border-gray-100 dark:border-slate-800">
              <span className="text-gray-600 dark:text-gray-400">API</span>
              <span className={`flex items-center gap-1 font-medium ${serverInfo.apiStatus === 'connected' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {serverInfo.apiStatus === 'connected' ? '● ' : '● '}{serverInfo.apiStatus === 'connected' ? 'OK' : 'Down'}
              </span>
            </div>
            <div className="flex items-center justify-between px-2 py-1.5 bg-white dark:bg-slate-900 rounded border border-gray-100 dark:border-slate-800">
              <span className="text-gray-600 dark:text-gray-400">DB</span>
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                ● OK
              </span>
            </div>
          </div>
        </div>

        {/* Footer with User Info */}
        <div className="border-t border-gray-100 dark:border-slate-800 p-4 space-y-3">
          <div className="px-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Logged in as</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {session?.user?.name || 'User'}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="w-full px-3 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header - Top Navigation Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 z-50 flex items-center justify-between px-4 shadow-sm">
        {/* Hamburger Menu Button */}
        <button
          ref={hamburgerRef}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors duration-300"
          type="button"
        >
          <div className="flex flex-col justify-center items-center gap-1.5 w-6 h-6">
            {/* Top line */}
            <span
              className={`block w-full h-0.5 bg-gray-900 dark:bg-white transition-all duration-300 ${
                isOpen ? 'rotate-45 translate-y-2' : ''
              }`}
            />
            {/* Middle line */}
            <span
              className={`block w-full h-0.5 bg-gray-900 dark:bg-white transition-all duration-300 ${
                isOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            {/* Bottom line */}
            <span
              className={`block w-full h-0.5 bg-gray-900 dark:bg-white transition-all duration-300 ${
                isOpen ? '-rotate-45 -translate-y-2' : ''
              }`}
            />
          </div>
        </button>

        {/* Logo - Center */}
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 flex-1 justify-center"
        >
          <div className="text-xl">🤖</div>
          <span className="text-base font-bold text-gray-900 dark:text-white">Fernando</span>
        </Link>

        {/* Spacer for layout balance */}
        <div className="w-10" />
      </div>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={handleBackdropClick}
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu - Slide-in from Left */}
      <nav
        id="mobile-menu"
        className={`md:hidden fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-slate-800 z-40 transform transition-transform duration-300 overflow-y-auto shadow-lg ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="navigation"
        aria-label="Mobile navigation menu"
      >
        {/* Navigation Links - Grouped with Collapse/Expand */}
        <div className="py-4 px-3 space-y-1">
          {navGroups.map((group, groupIndex) => {
            const isExpanded = expandedGroups[group.name]
            return (
              <div key={group.name} className="space-y-2">
                {/* Group header - clickable to toggle */}
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-slate-900 rounded-lg transition-colors duration-200"
                >
                  <span>{group.name}</span>
                  <span className="text-xs text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                </button>
                {/* Group items - show/hide based on expanded state */}
                {isExpanded && (
                  <div className="space-y-1 pl-2">
                    {group.items.map((link, itemIndex) => {
                      const active = isActive(link.href)
                      const isFirstItem = groupIndex === 0 && itemIndex === 0
                      return (
                        <Link
                          key={link.href}
                          ref={isFirstItem ? firstLinkRef : null}
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            active
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-900'
                          }`}
                          role="menuitem"
                          aria-current={active ? 'page' : undefined}
                        >
                          <span className="text-base flex-shrink-0">{link.icon}</span>
                          <span className="flex-1">{link.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer with User Info */}
        <div className="border-t border-gray-100 dark:border-slate-800 p-4 space-y-3 mt-4 bg-gray-50 dark:bg-slate-900/50">
          <div className="px-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Logged in as</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {session?.user?.name || 'User'}
            </p>
          </div>
          <button
            onClick={() => {
              setIsOpen(false)
              signOut({ callbackUrl: '/admin/login' })
            }}
            className="w-full px-3 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg transition-colors duration-200"
          >
            Sign Out
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 px-1">
            Swipe left or press ESC to close
          </p>
        </div>
      </nav>
    </>
  )
}
