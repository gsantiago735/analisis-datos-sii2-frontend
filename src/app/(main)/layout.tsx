import { cookies } from 'next/headers'
import Sidebar from '@/components/layout/Sidebar'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const role = cookieStore.get('role')?.value || 'user'

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      <Sidebar role={role} />
      <main className="flex-1 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  )
}
