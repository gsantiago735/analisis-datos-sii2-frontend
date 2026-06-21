import { cookies } from 'next/headers';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import UserDashboard from '@/components/dashboards/UserDashboard';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get('role')?.value || 'user';

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">Panel de Control Central</h1>
      
      {/* Si es admin, mostramos el panel de admin. Para cualquier otro caso (user), mostramos el de analista */}
      {role === 'admin' ? <AdminDashboard /> : <UserDashboard />}

      {/* Elementos comunes del dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
           <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
             <span className="text-indigo-600 font-bold">A</span>
           </div>
           <h3 className="font-bold text-gray-900 text-lg">Actividad Reciente</h3>
           <p className="text-gray-500 mt-2 leading-relaxed">Revisa los últimos cambios realizados en el sistema o tus inicios de sesión anteriores.</p>
         </div>
         
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
           <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center mb-4">
             <span className="text-rose-600 font-bold">N</span>
           </div>
           <h3 className="font-bold text-gray-900 text-lg">Notificaciones</h3>
           <p className="text-gray-500 mt-2 leading-relaxed">No tienes alertas pendientes ni mensajes de sistema por el momento.</p>
         </div>
      </div>
    </div>
  );
}
