'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  const links = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/inbox', label: 'Inbox', icon: '📬' },
    { href: '/admin/compose', label: 'Brain', icon: '🧠' },
    { href: '/admin/classify', label: 'Classify', icon: '⚠️' },
    { href: '/admin/search', label: 'Search', icon: '🔍' },
    { href: '/admin/agents', label: 'Agents', icon: '🤖' },
    { href: '/admin/rules', label: 'Rules', icon: '📜' },
    { href: '/admin/sessions', label: 'Sessions', icon: '📝' },
  ]

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
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
      {/* Hamburger Menu Button - Fixed Top-Left */}
      <button
        ref={hamburgerRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        className="fixed top-4 left-4 z-40 md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300"
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

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu - Slide-in from Left */}
      <nav
        id="mobile-menu"
        className={`fixed top-0 left-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-35 md:hidden transform transition-transform duration-300 overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="navigation"
        aria-label="Mobile navigation menu"
      >
        {/* Menu Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fernando
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Navigation
          </p>
        </div>

        {/* Navigation Links */}
        <div className="py-2">
          {links.map((link, index) => (
            <Link
              key={link.href}
              ref={index === 0 ? firstLinkRef : null}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg font-medium text-sm transition-colors duration-300 ${
                pathname === link.href
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <span className="text-lg">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Menu Footer - Close Hint */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Swipe left or press ESC to close
          </p>
        </div>
      </nav>

      {/* Bottom Tab Navigation - Always Visible */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-800 md:hidden z-20">
        <div className="flex justify-around items-center h-16">
          {links.slice(0, 5).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors duration-300 ${
                pathname === link.href
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title={link.label}
              role="menuitem"
              aria-current={pathname === link.href ? 'page' : undefined}
            >
              <span className="text-xl mb-1">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
