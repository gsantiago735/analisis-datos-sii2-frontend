export default function AdminDashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Dashboard de Administración</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-gray-500 text-sm font-medium">Usuarios Activos</h3>
          <p className="text-3xl font-bold mt-2 text-gray-900">12</p>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-gray-500 text-sm font-medium">Datasets Cargados</h3>
          <p className="text-3xl font-bold mt-2 text-gray-900">34</p>
        </div>
      </div>
    </div>
  );
}
