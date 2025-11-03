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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Core': true,
    'Content': true,
    'Management': false,
    'System': false,
  })
  const firstLinkRef = useRef<HTMLAnchorElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

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
      <aside className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen w-32 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
          <Link
            href="/admin/dashboard"
            className="text-xl font-bold text-gray-900 dark:text-white hover:opacity-80 transition-opacity"
          >
            Fernando
          </Link>
        </div>

        {/* Navigation Links - Grouped with Collapse/Expand */}
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-2">
          {navGroups.map((group) => {
            const isExpanded = expandedGroups[group.name]
            return (
              <div key={group.name} className="space-y-1">
                {/* Group header - clickable to toggle */}
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full text-center px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-200"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider">
                      {group.name}
                    </p>
                  </div>
                </button>
                {/* Group items - show/hide based on expanded state */}
                {isExpanded && group.items.map((link) => {
                  const active = isActive(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex flex-col items-center justify-center px-2 py-3 rounded-lg text-xs font-medium transition-colors duration-300 ${
                        active
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`}
                      title={link.label}
                    >
                      <span className="text-2xl mb-1">{link.icon}</span>
                      <span className="text-center leading-tight">{link.label}</span>
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Footer with User Info */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-3">
          <div className="px-2 py-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Logged in as</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {session?.user?.name || 'User'}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-300"
          >
            Sign Out
          </button>
          <div className="text-center pt-2">
            <p className="text-xs text-gray-400 dark:text-gray-600 font-mono">v2.3.3</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header - Top Navigation Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50 flex items-center justify-between px-4">
        {/* Hamburger Menu Button */}
        <button
          ref={hamburgerRef}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
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

        {/* Logo */}
        <Link
          href="/admin/dashboard"
          className="text-lg font-bold text-gray-900 dark:text-white flex-1 text-center"
        >
          Fernando
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
        className={`md:hidden fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 transform transition-transform duration-300 overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="navigation"
        aria-label="Mobile navigation menu"
      >
        {/* Navigation Links - Grouped with Collapse/Expand */}
        <div className="py-2 px-2 space-y-2">
          {navGroups.map((group, groupIndex) => {
            const isExpanded = expandedGroups[group.name]
            return (
              <div key={group.name} className="space-y-1">
                {/* Group header - clickable to toggle */}
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-200"
                >
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {group.name}
                  </p>
                  <span className="text-xs text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                </button>
                {/* Group items - show/hide based on expanded state */}
                {isExpanded && group.items.map((link, itemIndex) => {
                  const active = isActive(link.href)
                  const isFirstItem = groupIndex === 0 && itemIndex === 0
                  return (
                    <Link
                      key={link.href}
                      ref={isFirstItem ? firstLinkRef : null}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-300 ${
                        active
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`}
                      role="menuitem"
                      aria-current={active ? 'page' : undefined}
                    >
                      <span className="text-lg w-5 flex-shrink-0">{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Footer with User Info */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-3 mt-4">
          <div className="px-2 py-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Logged in as</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {session?.user?.name || 'User'}
            </p>
          </div>
          <button
            onClick={() => {
              setIsOpen(false)
              signOut({ callbackUrl: '/admin/login' })
            }}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-300"
          >
            Sign Out
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 px-2">
            Swipe left or press ESC to close
          </p>
        </div>
      </nav>
    </>
  )
}
