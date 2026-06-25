'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

type DatasetCreatedNoticeProps = {
  show: boolean
}

export default function DatasetCreatedNotice({ show }: DatasetCreatedNoticeProps) {
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    setVisible(show)

    if (!show) return

    const url = new URL(window.location.href)
    url.searchParams.delete('created')
    window.history.replaceState(null, '', `${url.pathname}${url.search}`)

    const timer = window.setTimeout(() => {
      setVisible(false)
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [show])

  if (!visible) return null

  return (
    <div className="mb-5 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
      <CheckCircle2 className="h-5 w-5 shrink-0" />
      Dataset creado exitosamente.
    </div>
  )
}
