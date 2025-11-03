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
        {/* Top nav is 64px tall (h-16), main starts below it */}
        <main className="pt-20 min-h-screen">
          <div className="max-w-screen-2xl mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
