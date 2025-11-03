export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{
      background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
    }}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
             style={{
               background: 'radial-gradient(circle, rgba(14, 165, 233, 0.4) 0%, transparent 70%)',
               filter: 'blur(60px)',
               animation: 'float 6s ease-in-out infinite'
             }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full"
             style={{
               background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)',
               filter: 'blur(60px)',
               animation: 'float 8s ease-in-out infinite reverse'
             }} />
      </div>

      {/* Coming Soon Content */}
      <div className="text-center px-6 relative z-10">
        <div className="text-8xl mb-8 animate-float">🚀</div>
        <h1 className="text-6xl md:text-8xl font-black mb-6 gradient-text">
          Fernando
        </h1>
        <p className="text-2xl md:text-3xl text-slate-400 mb-4">
          Coming Soon
        </p>
        <p className="text-lg text-slate-500 max-w-md mx-auto">
          Next-generation AI assistant platform
        </p>
      </div>
    </main>
  )
}
