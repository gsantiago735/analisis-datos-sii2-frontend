import React from 'react';
import axios from 'axios';

// Función para obtener los datos desde el backend de Docker
async function getBackendData() {
  try {
    //Usamos 'http://backend:8000' porque Docker resuelve 
    // el nombre del servicio como si fuera un dominio local.
    const API_URL = process.env.BACKEND_URL || 'http://backend:8000'
    const res = await axios.get(`${API_URL}/api/datos`);
    
    return res.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function HomePage() {
  const data = await getBackendData();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-900 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex flex-col gap-6">
        <h1 className="text-4xl font-bold text-blue-400">
          Prueba de Conexión Docker
        </h1>

        {data ? (
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 w-full max-w-md">
            <p className="text-green-400 font-bold mb-2">✅ ¡Conexión exitosa!</p>
            <p><strong>Proyecto:</strong> {data.proyecto}</p>
            <p className="mt-4 font-semibold text-slate-400">Datos recibidos:</p>
            <ul className="list-disc list-inside mt-2">
              {data.registros.map((reg: any) => (
                <li key={reg.id}>
                  {reg.nombre}: <span className="text-yellow-400">{reg.valor}%</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-red-900/50 p-6 rounded-lg border border-red-700 w-full max-w-md">
            <p className="text-red-400 font-bold">❌ Error de conexión</p>
            <p className="text-sm mt-1 text-red-200">
              No se pudo obtener respuesta de http://backend:8000. Asegúrate de que el contenedor de FastAPI esté corriendo.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}