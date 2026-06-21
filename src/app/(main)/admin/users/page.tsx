export default function AdminUsersPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
          + Nuevo Analista
        </button>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Rol</th>
              <th className="p-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 divide-y divide-gray-100">
            {/* Ejemplo estático por ahora */}
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="p-4">1</td>
              <td className="p-4 font-medium text-gray-900">admin@consultoria.com</td>
              <td className="p-4"><span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold">admin</span></td>
              <td className="p-4 text-right">
                <button className="text-blue-600 hover:text-blue-800 mx-2 font-medium">Editar</button>
              </td>
            </tr>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="p-4">2</td>
              <td className="p-4 font-medium text-gray-900">analista1@consultoria.com</td>
              <td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-semibold">analista</span></td>
              <td className="p-4 text-right">
                <button className="text-blue-600 hover:text-blue-800 mx-2 font-medium">Editar</button>
                <button className="text-red-600 hover:text-red-800 mx-2 font-medium">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
