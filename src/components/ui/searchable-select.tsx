import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  error?: string;
  allowClear?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * Select personalizado e pesquisavel (combobox) usado em toda a plataforma
 * para os filtros de setor, maquina, lancador, status etc. Resolve o
 * problema de dropdowns cortados das referencias: o Popover do Radix
 * reposiciona automaticamente dentro do viewport.
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  icon,
  disabled,
  error,
  allowClear,
  emptyMessage = "Nenhum resultado encontrado.",
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-lg border border-panel-border bg-navy-800 px-3 text-left text-sm",
            "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors disabled:opacity-50",
            error && "border-danger",
            className,
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {icon && <span className="shrink-0 text-brand-light">{icon}</span>}
          <span className={cn("flex-1 truncate", !selected && "text-muted")}>
            {selected ? selected.label : placeholder}
          </span>
          {allowClear && value && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="text-muted hover:text-slate-200"
              aria-label="Limpar selecao"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 w-[--radix-popover-trigger-width] overflow-hidden rounded-lg border border-panel-border bg-navy-800 shadow-soft"
        >
          <div className="flex items-center gap-2 border-b border-panel-border px-3 py-2">
            <Search className="h-4 w-4 text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="h-6 w-full bg-transparent text-sm text-slate-100 placeholder:text-muted focus:outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-sm text-muted">{emptyMessage}</p>
            )}
            {filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-navy-700",
                  opt.value === value && "bg-brand/15 text-brand-light",
                )}
                role="option"
                aria-selected={opt.value === value}
              >
                <span className="truncate">{opt.label}</span>
                {opt.value === value && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
