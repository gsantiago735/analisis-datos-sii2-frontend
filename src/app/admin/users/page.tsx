export default function AdminUsersPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
          + Nuevo Analista
        </button>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
            <tr>
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Rol</th>
              <th className="p-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-slate-300 divide-y divide-slate-800/50">
            {/* Ejemplo estático por ahora */}
            <tr className="hover:bg-slate-800/50">
              <td className="p-4">1</td>
              <td className="p-4">admin@consultoria.com</td>
              <td className="p-4"><span className="bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded text-xs">admin</span></td>
              <td className="p-4 text-right">
                <button className="text-slate-400 hover:text-white mx-2">Editar</button>
              </td>
            </tr>
            <tr className="hover:bg-slate-800/50">
              <td className="p-4">2</td>
              <td className="p-4">analista1@consultoria.com</td>
              <td className="p-4"><span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs">analista</span></td>
              <td className="p-4 text-right">
                <button className="text-slate-400 hover:text-white mx-2">Editar</button>
                <button className="text-red-400 hover:text-red-300 mx-2">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
