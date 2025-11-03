import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🤖</div>
          <span className="text-2xl font-bold text-white">Fernando</span>
        </div>
        <Link
          href="/admin"
          className="text-white hover:text-blue-300 transition-colors font-medium"
        >
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Your Personal AI Assistant.<br/>
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Everywhere You Work.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-blue-200 mb-12 max-w-3xl mx-auto leading-relaxed">
            Fernando syncs your knowledge, sessions, and insights across all your devices.
            Work on your Mac, switch to your iPhone, continue on any machine - seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="#waitlist"
              className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold rounded-lg transition-all transform hover:scale-105 shadow-xl"
            >
              Get Your Own Fernando
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 bg-white bg-opacity-10 backdrop-blur hover:bg-opacity-20 text-white text-lg font-semibold rounded-lg transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-slate-800 bg-opacity-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Everything You Need in Your AI Assistant
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800 bg-opacity-50 backdrop-blur p-8 rounded-xl border border-blue-500 border-opacity-20">
              <div className="text-4xl mb-4">💻</div>
              <h3 className="text-2xl font-bold text-white mb-3">Terminal Integration</h3>
              <p className="text-blue-200">
                Launch Fernando directly from your terminal. Work in tmux sessions with full context awareness.
              </p>
            </div>

            <div className="bg-slate-800 bg-opacity-50 backdrop-blur p-8 rounded-xl border border-blue-500 border-opacity-20">
              <div className="text-4xl mb-4">☁️</div>
              <h3 className="text-2xl font-bold text-white mb-3">Cloud Sync</h3>
              <p className="text-blue-200">
                All your knowledge, sessions, and decisions sync automatically across every device you use.
              </p>
            </div>

            <div className="bg-slate-800 bg-opacity-50 backdrop-blur p-8 rounded-xl border border-blue-500 border-opacity-20">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-2xl font-bold text-white mb-3">Mobile Access</h3>
              <p className="text-blue-200">
                Quick capture ideas, search your knowledge base, and review sessions from your iPhone.
              </p>
            </div>

            <div className="bg-slate-800 bg-opacity-50 backdrop-blur p-8 rounded-xl border border-blue-500 border-opacity-20">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-2xl font-bold text-white mb-3">Knowledge Base</h3>
              <p className="text-blue-200">
                Fernando learns from every session and builds a searchable knowledge base of your decisions.
              </p>
            </div>

            <div className="bg-slate-800 bg-opacity-50 backdrop-blur p-8 rounded-xl border border-blue-500 border-opacity-20">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-2xl font-bold text-white mb-3">Multi-Session</h3>
              <p className="text-blue-200">
                Run multiple Fernando sessions simultaneously across different projects and contexts.
              </p>
            </div>

            <div className="bg-slate-800 bg-opacity-50 backdrop-blur p-8 rounded-xl border border-blue-500 border-opacity-20">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold text-white mb-3">Cost Optimized</h3>
              <p className="text-blue-200">
                Smart agent orchestration uses Haiku for simple tasks, Sonnet for complex reasoning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            How Fernando Works
          </h2>

          <div className="space-y-12">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Install on Your Mac</h3>
                <p className="text-blue-200">
                  One command installs Fernando CLI with full terminal integration. Launch sessions with <code className="bg-slate-800 px-2 py-1 rounded">fernando start</code>
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Work with Context</h3>
                <p className="text-blue-200">
                  Fernando tracks your sessions, decisions, and learnings. Every interaction builds your personal knowledge base.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Access Anywhere</h3>
                <p className="text-blue-200">
                  Add your iPhone, install on another Mac, or access the web dashboard. Your knowledge follows you everywhere.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section id="waitlist" className="py-20 px-6 bg-gradient-to-br from-blue-600 to-cyan-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Get Your Own Fernando
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join the waitlist to be notified when Fernando becomes available for your organization.
          </p>

          <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="you@company.com"
              className="flex-1 px-6 py-4 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              required
            />
            <button
              type="submit"
              className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white text-lg font-semibold rounded-lg transition-all"
            >
              Join Waitlist
            </button>
          </form>

          <p className="text-sm text-blue-100 mt-6">
            We'll notify you as soon as Fernando is ready for deployment.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-900">
        <div className="max-w-6xl mx-auto text-center text-blue-300">
          <p className="mb-4">© 2025 Fernando. Built for developers, by developers.</p>
          <div className="flex justify-center gap-6">
            <Link href="/admin" className="hover:text-white transition-colors">
              Admin Access
            </Link>
            <Link href="https://github.com/peter-directskip/fernando" className="hover:text-white transition-colors">
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
