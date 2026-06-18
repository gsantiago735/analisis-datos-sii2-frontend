export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar del Admin */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:block">
        <div className="p-4">
          <h2 className="text-xl font-bold text-white mb-6">Admin Panel</h2>
          <nav className="space-y-2">
            <a href="/admin" className="block px-4 py-2 text-slate-300 hover:bg-slate-800 rounded">
              Dashboard
            </a>
            <a href="/admin/users" className="block px-4 py-2 text-slate-300 hover:bg-slate-800 rounded">
              Usuarios
            </a>
            <a href="/dashboard" className="block px-4 py-2 text-blue-400 hover:bg-slate-800 rounded mt-8">
              Ir a la App
            </a>
          </nav>
        </div>
      </aside>
      
      {/* Contenido Principal */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
