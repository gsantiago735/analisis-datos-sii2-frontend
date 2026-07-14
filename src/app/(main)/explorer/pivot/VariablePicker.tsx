'use client';

import { Check } from 'lucide-react';

import type { PerfiladoVariable } from './types';

interface VariablePickerProps {
  label: string;
  helper?: string;
  variables: PerfiladoVariable[];
  mode: 'single' | 'multi';
  selected: string[];
  disabledNames?: string[];
  onChange: (next: string[]) => void;
  emptyMessage?: string;
}

export function VariablePicker({
  label,
  helper,
  variables,
  mode,
  selected,
  disabledNames = [],
  onChange,
  emptyMessage = 'No hay variables disponibles.',
}: VariablePickerProps) {
  function toggle(nombre: string) {
    if (mode === 'single') {
      onChange([nombre]);
      return;
    }
    if (selected.includes(nombre)) {
      onChange(selected.filter((n) => n !== nombre));
    } else {
      onChange([...selected, nombre]);
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className="text-sm font-medium text-[var(--ink)]">{label}</label>
        {helper && <span className="text-xs text-[var(--ink-muted)]">{helper}</span>}
      </div>

      {variables.length === 0 ? (
        <p className="rounded-md border border-dashed border-[var(--border)] px-3 py-4 text-center text-xs text-[var(--ink-muted)]">
          {emptyMessage}
        </p>
      ) : (
        <div className="max-h-48 space-y-0.5 overflow-y-auto rounded-md border border-[var(--border)] p-1">
          {variables.map((v) => {
            const isSelected = selected.includes(v.nombre);
            const isDisabled = disabledNames.includes(v.nombre);
            return (
              <button
                key={v.nombre}
                type="button"
                disabled={isDisabled}
                title={isDisabled ? 'Ya está seleccionada en el otro eje' : undefined}
                onClick={() => toggle(v.nombre)}
                className={`flex w-full items-center justify-between gap-2 rounded px-2.5 py-1.5 text-left text-sm transition-colors ${
                  isSelected
                    ? 'bg-[var(--accent-soft)] font-medium text-[var(--accent-ink)]'
                    : 'text-[var(--ink)] hover:bg-[var(--bg)]'
                } ${isDisabled ? 'cursor-not-allowed opacity-40 hover:bg-transparent' : ''}`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center border ${
                      mode === 'single' ? 'rounded-full' : 'rounded'
                    } ${isSelected ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--border)]'}`}
                  >
                    {isSelected && mode === 'multi' && (
                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />
                    )}
                    {isSelected && mode === 'single' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  <span className="truncate">{v.nombre}</span>
                </span>
                <span className="shrink-0 rounded-full bg-[var(--bg)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
                  {v.tipo}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
