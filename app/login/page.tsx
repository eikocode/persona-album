'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { signIn, signUp, user } = useAuth()

  if (user) {
    router.push('/')
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        router.push('/')
      } else {
        await signUp(email, password)
        setSuccess(true)
        setEmail('')
        setPassword('')
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 to-violet-800 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-sm text-center">
          <svg className="w-16 h-16 mx-auto mb-6 opacity-90" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
          <h2 className="text-3xl font-bold mb-4">Persona Album</h2>
          <p className="text-violet-200 text-lg leading-relaxed">
            Upload black &amp; white photos and bring them to life with AI-powered colorization.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 opacity-70">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-white/20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#F8F8F8]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Persona Album</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {mode === 'login'
                ? 'Sign in to your account to continue'
                : 'Sign up to start colorizing photos'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                             focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition"
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                             focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  disabled={loading}
                />
                {mode === 'signup' && (
                  <p className="mt-1 text-xs text-gray-400">Minimum 6 characters</p>
                )}
              </div>

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2.5 rounded-lg text-sm">
                  Account created! You can now sign in.
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg font-medium text-white bg-violet-600
                           hover:bg-violet-700 transition-colors disabled:opacity-50
                           disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                  </>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            <div className="mt-5 space-y-3 text-center">
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(false) }}
                className="text-sm text-violet-600 hover:text-violet-700 font-medium"
              >
                {mode === 'login'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>

              <div>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Continue without signing in →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
