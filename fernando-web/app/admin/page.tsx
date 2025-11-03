import Link from 'next/link'

export default function AdminHome() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="text-center text-white max-w-md">
        <h1 className="text-5xl font-bold mb-4">Fernando Admin</h1>
        <p className="text-xl mb-8 text-blue-100">Your Personal AI Assistant Dashboard</p>

        <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-8 mb-8">
          <p className="text-blue-100 mb-6">
            Access your knowledge, sessions, and quick capture from anywhere.
          </p>

          <div className="space-y-3">
            <Link
              href="/admin/dashboard"
              className="block w-full bg-white text-blue-600 font-semibold py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Enter Dashboard
            </Link>
            <Link
              href="/admin/search"
              className="block w-full bg-blue-400 text-white font-semibold py-3 rounded-lg hover:bg-blue-300 transition-colors"
            >
              Search Knowledge
            </Link>
          </div>
        </div>

        <p className="text-sm text-blue-100">
          Built for desktop and mobile
        </p>
      </div>
    </main>
  )
}
