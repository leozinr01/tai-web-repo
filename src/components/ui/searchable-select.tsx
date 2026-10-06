import { useEffect, useId, useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  /** Aparece esmaecida na lista e nao pode ser escolhida. */
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  /** Vai no botao que abre a lista, para um `<label htmlFor>` apontar para o campo. */
  id?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  error?: string;
  allowClear?: boolean;
  emptyMessage?: string;
  className?: string;
  /** Quando false, oculta o campo de busca e mostra apenas a lista de opções. */
  searchable?: boolean;
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
  id,
  placeholder = "Selecione...",
  icon,
  disabled,
  error,
  allowClear,
  emptyMessage = "Nenhum resultado encontrado.",
  className,
  searchable = true,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Opcao destacada pelo teclado (setas) ou pelo mouse; Enter escolhe ela.
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const optionId = (index: number) => `${listId}-${index}`;
  const activeOptionId = filtered[activeIndex] ? optionId(activeIndex) : undefined;

  useEffect(() => {
    if (open && activeOptionId) document.getElementById(activeOptionId)?.scrollIntoView?.({ block: "nearest" });
  }, [open, activeOptionId]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const choose = (option: SelectOption | undefined) => {
    if (!option || option.disabled) return;
    onChange(option.value);
    close();
  };

  // Anda a partir de `from` no sentido de `step`, pulando opcoes desabilitadas; fica onde esta se nao houver outra.
  const moveActive = (from: number, step: 1 | -1) => {
    for (let i = from + step; i >= 0 && i < filtered.length; i += step) {
      if (!filtered[i]?.disabled) {
        setActiveIndex(i);
        return;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveActive(activeIndex, 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveActive(activeIndex, -1);
    } else if (e.key === "Home") {
      e.preventDefault();
      moveActive(-1, 1);
    } else if (e.key === "End") {
      e.preventDefault();
      moveActive(filtered.length, -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(filtered[activeIndex]);
    }
  };

  return (
    <Popover.Root
      // modal: o conteudo vai para um portal fora do Dialog, e o bloqueio de scroll do Dialog
      // engolia a roda do mouse na lista. Como modal, o Popover libera o scroll dentro dele.
      modal
      open={open}
      onOpenChange={(next) => {
        if (!next) return close();
        // Abre com a opcao atual destacada, para as setas partirem dela.
        setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
        setOpen(true);
      }}
    >
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-left text-xs font-normal",
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
              aria-label="Limpar seleção"
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
          onKeyDown={handleKeyDown}
          className="z-50 w-[--radix-popover-trigger-width] overflow-hidden rounded-xl border border-white/10 bg-navy-900/95 shadow-2xl backdrop-blur-xl"
        >
          {searchable && (
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
              <Search className="h-4 w-4 text-muted" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Buscar..."
                role="combobox"
                aria-expanded
                aria-controls={listId}
                aria-activedescendant={activeOptionId}
                aria-autocomplete="list"
                className="h-6 w-full bg-transparent text-sm text-slate-100 placeholder:text-muted focus:outline-none"
              />
            </div>
          )}
          {/* Sem campo de busca, a propria lista recebe o foco e as teclas. */}
          <div
            id={listId}
            role="listbox"
            tabIndex={searchable ? -1 : 0}
            aria-activedescendant={searchable ? undefined : activeOptionId}
            className="max-h-64 overflow-y-auto py-1 focus:outline-none"
          >
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-sm text-muted">{emptyMessage}</p>
            )}
            {filtered.map((opt, index) => (
              <button
                key={opt.value}
                id={optionId(index)}
                type="button"
                tabIndex={-1}
                disabled={opt.disabled}
                onClick={() => choose(opt)}
                onMouseMove={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm",
                  "disabled:cursor-not-allowed disabled:opacity-30",
                  opt.value === value && "bg-brand/15 text-brand-light",
                  index === activeIndex && !opt.disabled && "bg-white/10",
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
