export default function UserDashboard() {
  return (
    <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-xl mb-8 shadow-sm">
      <h2 className="text-xl font-bold text-emerald-900 mb-2">Vista de Analista (Usuario Estándar)</h2>
      <p className="text-emerald-800">Bienvenido a tu panel analítico. Aquí puedes visualizar métricas en tiempo real, generar reportes de desempeño y explorar los datos del SII2.</p>
      <div className="mt-5 flex gap-4">
        <button className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg shadow-md hover:bg-emerald-700 transition-colors">Ver Métricas Clave</button>
        <button className="px-5 py-2.5 bg-white border border-emerald-200 text-emerald-700 font-medium rounded-lg shadow-sm hover:bg-emerald-50 transition-colors">Generar Nuevo Reporte</button>
      </div>
    </div>
  )
}
