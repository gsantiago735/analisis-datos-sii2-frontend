import UploadForm from '@/components/upload/UploadForm'

export default function UploadPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#0F172A]">Cargar dataset</h1>
        <p className="text-gray-500 mt-2">Agrega un nuevo archivo a tu biblioteca de datos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <UploadForm />
        </div>

        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-[#0F172A] mb-4">¿Cómo funciona?</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <p className="font-semibold text-sm text-[#0F172A]">Selecciona el archivo</p>
                  <p className="text-xs text-gray-500 mt-0.5">Arrástralo o búscalo en tu dispositivo.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <p className="font-semibold text-sm text-[#0F172A]">Identifica el dataset</p>
                  <p className="text-xs text-gray-500 mt-0.5">Asigna un nombre y una descripción.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <p className="font-semibold text-sm text-[#0F172A]">Guarda</p>
                  <p className="text-xs text-gray-500 mt-0.5">Quedará habilitado para perfilado y estadísticas.</p>
                </div>
              </li>
            </ul>

            <h3 className="font-bold text-[#0F172A] mt-8 mb-4">Formatos permitidos</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs font-semibold text-gray-600">CSV</span>
              <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs font-semibold text-gray-600">XLS</span>
              <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs font-semibold text-gray-600">XLSX</span>
              <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs font-semibold text-gray-600">TXT</span>
              <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs font-semibold text-gray-600">DAT</span>
            </div>

            <div className="mt-6 p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg">
              <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                No se solicita tamaño máximo, separador, codificación ni vista previa en esta versión.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
