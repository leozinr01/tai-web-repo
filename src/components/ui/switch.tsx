import * as RadixSwitch from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  className,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <RadixSwitch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={ariaLabel}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border border-white/10 bg-white/10 outline-none transition-colors data-[state=checked]:bg-brand data-[state=checked]:border-brand",
        className,
      )}
    >
      <RadixSwitch.Thumb className="block h-4 w-4 translate-x-1 rounded-full bg-white shadow-soft transition-transform data-[state=checked]:translate-x-6" />
    </RadixSwitch.Root>
  );
}
