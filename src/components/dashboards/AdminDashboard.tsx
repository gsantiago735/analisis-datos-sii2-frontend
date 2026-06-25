export default function AdminDashboard() {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl mb-8 shadow-sm">
      <h2 className="text-xl font-bold text-blue-900 mb-2">Vista de Administrador</h2>
      <p className="text-blue-800">Bienvenido al área de administración. Aquí puedes gestionar usuarios, configurar el sistema y revisar logs de acceso de toda la plataforma.</p>
      <div className="mt-5 flex gap-4">
        <button className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors">Gestionar Usuarios</button>
        <button className="px-5 py-2.5 bg-white border border-blue-200 text-blue-700 font-medium rounded-lg shadow-sm hover:bg-blue-50 transition-colors">Configuración Global</button>
      </div>
    </div>
  )
}
