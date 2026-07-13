'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Bot,
  Upload,
  FileText,
  LineChart,
  PieChart,
  TableProperties,
  Settings,
  Users,
  LogOut
} from 'lucide-react'

import { logoutAction } from '@/app/actions/auth'

const navItems = [
  { name: 'Panel principal', href: '/dashboard', icon: LayoutDashboard, roles: ['analista', 'admin'] },
  { name: 'Panel Administración', href: '/admin', icon: Settings, roles: ['admin'] },
  { name: 'Gestión de Usuarios', href: '/admin/users', icon: Users, roles: ['admin'] },
  { name: 'Subir Datos', href: '/upload', icon: Upload, roles: ['analista', 'admin'] },
  { name: 'Perfilado de Datos', href: '/explorer/frequencies', icon: PieChart, roles: ['analista', 'admin'] },
  { name: 'Asistente IA', href: '/assistant', icon: Bot, roles: ['analista', 'admin'] },
  { name: 'Resumen ejecutivo', href: '/executive-summary', icon: FileText, roles: ['analista', 'admin'] },
  { name: 'Exp. Correlación', href: '/explorer/correlation', icon: LineChart, roles: ['analista', 'admin']},
  { name: 'Exp. Tablas Dinámicas', href: '/explorer/pivot', icon: TableProperties, roles: ['analista', 'admin'], disabled: true },
]

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()

  const handleLogout = async () => {
    await logoutAction();
  };

  const visibleItems = navItems.filter(item => item.roles.includes(role))

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col sticky top-0 shrink-0 shadow-sm">
      <div className="p-6 border-b border-gray-100 flex items-center justify-center">
        <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight">SII2 Data</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          if (item.disabled) {
            return (
              <button
                key={item.name}
                disabled
                title="Disponible próximamente"
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-300"
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.name}
              </button>
            )
          }
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
