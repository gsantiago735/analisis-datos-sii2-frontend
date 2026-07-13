'use client'

import { FormEvent, useMemo, useState, useTransition } from 'react'
import { Bot, Loader2, Send, Sparkles } from 'lucide-react'
import { askAssistantAction } from '@/app/actions/assistant'
import type { AssistantAnswer } from '@/app/actions/assistant'
import type { DatasetItem } from '@/app/actions/datasets'

type AssistantChatProps = {
  datasets: DatasetItem[]
  selectedDatasetId: number
}

export default function AssistantChat({ datasets, selectedDatasetId }: AssistantChatProps) {
  const [currentDatasetId, setCurrentDatasetId] = useState(selectedDatasetId)
  const [question, setQuestion] = useState('')
  const [lastAnswer, setLastAnswer] = useState<AssistantAnswer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === currentDatasetId) || datasets[0],
    [datasets, currentDatasetId],
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startTransition(async () => {
      setError(null)
      const result = await askAssistantAction(currentDatasetId, question)

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.answer) {
        setLastAnswer(result.answer)
      }
    })
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 bg-[#f4f7fb] text-slate-900 xl:grid-cols-[360px_1fr]">
      <aside className="border-b border-slate-200 bg-white p-6 xl:border-b-0 xl:border-r">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Asistente IA</h1>
            <p className="text-sm font-medium text-slate-400">Preguntas sobre perfilado</p>
          </div>
        </div>

        <label className="mt-8 block">
          <span className="mb-2 block text-xs font-black uppercase text-slate-400">Dataset</span>
          <select
            value={currentDatasetId}
            onChange={(event) => {
              setCurrentDatasetId(Number(event.target.value))
              setLastAnswer(null)
              setError(null)
            }}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {datasets.map((dataset) => (
              <option key={dataset.id} value={dataset.id}>
                {dataset.nombre} · ID {dataset.id}
              </option>
            ))}
          </select>
        </label>

        {selectedDataset && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-800">{selectedDataset.nombre}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{selectedDataset.nombre_archivo || 'Sin archivo asociado'}</p>
            <p className="mt-3 text-xs font-black text-blue-600">dataset_id: {selectedDataset.id}</p>
          </div>
        )}
      </aside>

      <main className="p-6 lg:p-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2 text-sm font-black text-blue-600">
              <Sparkles className="h-4 w-4" />
              Consulta el perfilado del dataset seleccionado
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={5}
                placeholder="Ej: ¿El dataset está balanceado? ¿Cuál es el valor mínimo de edad? ¿Qué categoría se repite más?"
                className="w-full resize-none rounded-xl border border-slate-300 bg-white p-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-400">
                  Se enviará el ID {currentDatasetId} junto con tu pregunta.
                </p>
                <button
                  type="submit"
                  disabled={isPending || !question.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {isPending ? 'Consultando...' : 'Preguntar'}
                </button>
              </div>
            </form>
          </section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {lastAnswer && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase text-slate-400">Pregunta</p>
              <p className="mt-2 text-base font-bold text-slate-900">{lastAnswer.question}</p>

              <div className="mt-6 rounded-xl bg-blue-50 p-5 text-sm font-medium leading-7 text-slate-800">
                {lastAnswer.answer}
              </div>

              <p className="mt-4 text-xs font-semibold text-slate-400">
                Dataset ID {lastAnswer.dataset_id} · Modelo {lastAnswer.model}
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
