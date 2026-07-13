'use client'

import { useState, useRef, useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, File as FileIcon, X } from 'lucide-react'
import { uploadDatasetAction } from '@/app/actions/upload'

export default function UploadForm() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  
  // useActionState for form submission handling in Next 15
  const [state, formAction, isPending] = useActionState(uploadDatasetAction, null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      
      // Sincronizar con el input nativo para que formData lo recoja
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(droppedFile);
        fileInputRef.current.files = dt.files;
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    if (state?.sessionExpired) {
      // replace evita que el botón "Atrás" regrese a una vista cuya sesión ya
      // no es válida. El login usa el motivo para mostrar el mensaje adecuado.
      router.replace('/login?reason=session-expired')
      return
    }

    if (state?.success && state.data?.dataset_id) {
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      router.push(`/datasets/${state.data.dataset_id}?created=1`)
    }
  }, [router, state])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Información del dataset</h2>
        <p className="text-sm text-gray-500 mt-1">Selecciona el archivo y completa los datos solicitados.</p>
      </div>

      <form action={formAction} className="p-6 space-y-6">
        {/* Alerts */}
        {state?.error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {state.error}
          </div>
        )}
        {/* Drag & Drop Area */}
        <div 
          className={`relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl transition-colors ${
            dragActive ? 'border-teal-500 bg-teal-50' : 'border-gray-300 bg-gray-50/50 hover:bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            name="file" 
            ref={fileInputRef}
            onChange={handleFileChange} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".csv,.xls,.xlsx,.txt,.dat"
          />
          
          {!file ? (
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                <UploadCloud className="w-6 h-6 text-teal-600" />
              </div>
              <p className="font-semibold text-gray-900">Arrastra y suelta tu archivo aquí</p>
              <p className="text-sm text-gray-500 mt-1">o utiliza el selector de archivos de tu dispositivo</p>
              <button 
                type="button" 
                className="mt-4 px-4 py-2 border border-teal-600 text-teal-700 font-medium rounded-lg text-sm hover:bg-teal-50 transition-colors pointer-events-none"
              >
                Seleccionar archivo
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 relative">
                <FileIcon className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-semibold text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button 
                type="button" 
                onClick={(e) => { e.preventDefault(); removeFile(); }}
                className="mt-4 flex items-center text-red-600 hover:text-red-800 text-sm font-medium z-10"
              >
                <X className="w-4 h-4 mr-1" /> Remover archivo
              </button>
            </div>
          )}
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-semibold text-gray-900 mb-1">
              Nombre del dataset <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              id="nombre" 
              name="nombre" 
              required
              placeholder="Ej. Ventas regionales 2026"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label htmlFor="descripcion" className="block text-sm font-semibold text-gray-900">
                Descripción
              </label>
              <span className="text-xs text-gray-500">0/300</span>
            </div>
            <textarea 
              id="descripcion" 
              name="descripcion" 
              rows={4}
              maxLength={300}
              placeholder="Describe brevemente el contenido o propósito del dataset..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button 
            type="button" 
            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={isPending || !file}
            className="px-6 py-2.5 bg-[#84A9AC] text-white font-medium rounded-lg text-sm hover:bg-[#3B6978] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
