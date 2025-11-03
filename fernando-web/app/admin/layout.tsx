'use client'

import { usePathname } from 'next/navigation'
import AdminNav from '@/components/AdminNav'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  // Pages that use custom full-screen layout
  const isAgentsPage = pathname === '/admin/agents'
  const isChatPage = pathname === '/admin/chat'

  if (isLoginPage) {
    return <>{children}</>
  }

  // Full-screen pages get the nav but manage their own layout
  if (isAgentsPage || isChatPage) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen">
          <AdminNav />
          {children}
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <AdminNav />
        {/* Desktop: Sidebar is 256px (w-64), main starts at 256px (ml-64) - NO OVERLAP */}
        <main className="md:ml-64 pt-16 md:pt-0 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
