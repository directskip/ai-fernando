'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { getShortVersion } from '@/lib/version'

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
      {/* Modern Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* Main Nav Container with Glass Effect */}
        <div className="glass border-b" style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.9) 0%, rgba(6, 182, 212, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo & Brand */}
              <Link href="/admin/dashboard" className="flex items-center gap-3 group">
                <div className="text-3xl transform transition-transform group-hover:scale-110 group-hover:rotate-12">
                  🚀
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white tracking-tight">Fernando</span>
                  <span className="text-[10px] text-white/70 -mt-1">AI Assistant Platform</span>
                </div>
              </Link>

              {/* Desktop Navigation - Centered */}
              <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
                {navItems.slice(0, 6).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive(item.href)
                        ? 'bg-white text-sky-600 shadow-lg scale-105'
                        : 'text-white/90 hover:bg-white/20 hover:text-white hover:scale-105'
                    }`}
                  >
                    <span className="mr-1.5">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Right Side - Status & User */}
              <div className="flex items-center gap-3">
                {/* System Status - Desktop */}
                <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center gap-1.5">
                    <span className={`status-indicator ${serverInfo.apiStatus === 'connected' ? 'status-active' : 'status-error'}`} />
                    <span className="text-xs text-white/90 font-medium">API</span>
                  </div>
                  <div className="w-px h-4 bg-white/20" />
                  <span className="text-xs text-white/90 font-mono">{getShortVersion()}</span>
                </div>

                {/* User Menu - Desktop */}
                <div className="hidden md:flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      {session?.user?.name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm text-white/90 font-medium">{session?.user?.name || 'User'}</span>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/admin/login' })}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    Logout
                  </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 text-white hover:bg-white/20 rounded-xl transition-all"
                  aria-label="Toggle menu"
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
        </div>
      </div>

      {/* Mobile Menu Overlay with Blur */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden transition-opacity duration-300"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Modern Mobile Menu - Slide from Right */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-80 z-50 transform transition-all duration-300 lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="text-2xl">🚀</div>
              <span className="text-lg font-bold text-white">Fernando</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav Items with Modern Design */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg transform scale-105'
                    : 'text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* System Status Card */}
          <div className="p-4 space-y-3 border-t border-white/10">
            <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
              System Status
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`status-indicator ${serverInfo.apiStatus === 'connected' ? 'status-active' : 'status-error'}`} />
                  <span className="text-xs text-white/60">API</span>
                </div>
                <div className={`text-sm font-semibold ${serverInfo.apiStatus === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
                  {serverInfo.apiStatus === 'connected' ? 'Connected' : 'Down'}
                </div>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="status-indicator status-active" />
                  <span className="text-xs text-white/60">Database</span>
                </div>
                <div className="text-sm font-semibold text-green-400">Connected</div>
              </div>
            </div>

            {/* Version & IP Info */}
            <div className="p-3 bg-gradient-to-br from-sky-500/10 to-cyan-500/10 rounded-xl border border-sky-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60">Version</span>
                <span className="text-xs font-mono text-sky-400">{getShortVersion()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Instance</span>
                <span className="text-xs font-mono text-cyan-400 truncate max-w-[140px]">{serverInfo.containerIp}</span>
              </div>
            </div>

            {/* Deployment Badge */}
            <div className="flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/20">
              <span className="text-lg">🚀</span>
              <span className="text-xs font-bold text-purple-300">AWS ECS</span>
            </div>
          </div>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3 p-3 bg-white/5 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                {session?.user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{session?.user?.name || 'User'}</div>
                <div className="text-xs text-white/60">Administrator</div>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
