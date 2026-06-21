export default function AdminDashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard de Administración</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-slate-400 text-sm font-medium">Usuarios Activos</h3>
          <p className="text-3xl font-bold mt-2">12</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-slate-400 text-sm font-medium">Datasets Cargados</h3>
          <p className="text-3xl font-bold mt-2">34</p>
        </div>
      </div>
    </div>
  );
}
