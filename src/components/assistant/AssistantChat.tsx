'use client'

import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from 'react'
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
  const [conversation, setConversation] = useState<AssistantAnswer[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const conversationEndRef = useRef<HTMLDivElement>(null)

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === currentDatasetId) || datasets[0],
    [datasets, currentDatasetId],
  )

  // Mantiene visible la respuesta más reciente sin desplazar el campo de
  // escritura fuera del área principal del chat.
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation, isPending])

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
        setConversation((current) => [...current, result.answer])
        setQuestion('')
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
              setConversation([])
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

      <main className="min-h-[calc(100vh-4rem)] p-6 lg:p-8 xl:h-[calc(100vh-4rem)] xl:min-h-0">
        <div className="mx-auto flex h-full max-w-4xl flex-col">
          <div className="mb-5 flex items-center gap-2 text-sm font-black text-blue-600">
            <Sparkles className="h-4 w-4" />
            Puedes hacerme preguntas sobre el dataset que selecciones
          </div>

          {/* Historial desplazable: las respuestas siempre aparecen antes del compositor. */}
          <section className="min-h-72 flex-1 space-y-6 overflow-y-auto pr-1 pb-6">
            {conversation.length === 0 && !isPending && (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 text-center">
                <Bot className="h-8 w-8 text-blue-500" />
                <p className="mt-3 text-sm font-bold text-slate-700">Selecciona un dataset y escribe tu primera pregunta.</p>
                <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
                  Puedo ayudarte a interpretar su perfilado, calidad, distribuciones y hallazgos principales.
                </p>
              </div>
            )}

            {conversation.map((message, index) => (
              <article key={`${message.dataset_id}-${index}`} className="space-y-4">
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-blue-600 px-5 py-3 text-sm font-semibold leading-6 text-white shadow-sm">
                  {message.question}
                </div>

                <div className="flex max-w-[92%] items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Bot className="h-4 w-4" />
                  </span>
                  <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-slate-800">{message.answer}</p>
                    <p className="mt-3 text-xs font-semibold text-slate-400">Dataset ID {message.dataset_id}</p>
                  </div>
                </div>
              </article>
            ))}

            {isPending && (
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
                Analizando el dataset…
              </div>
            )}

            <div ref={conversationEndRef} />
          </section>

          {/* El compositor permanece debajo del historial, como en un chat convencional. */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">
                {error}
              </div>
            )}

            <div className="mb-3 flex items-center gap-2 text-sm font-black text-blue-600">
              <Sparkles className="h-4 w-4" />
              Escribe tu pregunta
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault()
                    event.currentTarget.form?.requestSubmit()
                  }
                }}
                rows={3}
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
        </div>
      </main>
    </div>
  )
}
