import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useLiveInvalidation } from "@/hooks/use-live-invalidation";

function setup(companyId: string) {
  const qc = new QueryClient();
  const invalidate = vi.spyOn(qc, "invalidateQueries");
  const stop = vi.fn();
  let notify = () => {};
  const watch = vi.fn((_companyId: string, onChange: () => void) => {
    notify = onChange;
    return stop;
  });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  const hook = renderHook(() => useLiveInvalidation(watch, "appointments", companyId), { wrapper });
  return { hook, watch, stop, invalidate, notify: () => notify() };
}

describe("useLiveInvalidation", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("junta varias mudancas seguidas em um unico recarregamento", () => {
    const { watch, invalidate, notify } = setup("empresa-1");
    expect(watch).toHaveBeenCalledWith("empresa-1", expect.any(Function));

    notify();
    notify();
    notify();
    expect(invalidate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["appointments", "empresa-1"] });
  });

  it("para de ouvir e cancela o recarregamento pendente ao sair da tela", () => {
    const { hook, stop, invalidate, notify } = setup("empresa-1");
    notify();
    hook.unmount();
    vi.advanceTimersByTime(500);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("nao se inscreve sem empresa", () => {
    const { watch } = setup("");
    expect(watch).not.toHaveBeenCalled();
  });
});
