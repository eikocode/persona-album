'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function NavBar() {
  const { user, signOut, loading } = useAuth()

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
          <svg className="w-7 h-7 text-violet-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
          Persona Album
        </Link>

        {/* Right: auth */}
        <div>
          {loading ? (
            <div className="h-9 w-24 bg-gray-100 animate-pulse rounded-lg" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:block">{user.email}</span>
              <button
                onClick={async () => { try { await signOut() } catch {} }}
                className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
