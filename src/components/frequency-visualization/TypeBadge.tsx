import type { VariableDataType } from "./types";

const STYLES: Record<VariableDataType, string> = {
  INTEGER: "bg-blue-50 text-blue-700 ring-blue-200",
  DECIMAL: "bg-violet-50 text-violet-700 ring-violet-200",
  STRING: "bg-amber-50 text-amber-700 ring-amber-200",
};

const LABELS: Record<VariableDataType, string> = {
  INTEGER: "Entero",
  DECIMAL: "Decimal",
  STRING: "Texto",
};

export function TypeBadge({ type }: { type: VariableDataType }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${STYLES[type]}`}
    >
      {LABELS[type]}
    </span>
  );
}
