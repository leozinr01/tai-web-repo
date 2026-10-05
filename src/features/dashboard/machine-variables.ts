import type { Machine, MachineVariableKey } from "@/domain/entities/machine";

export interface VariableDisplay {
  key: MachineVariableKey;
  label: string;
  value: string;
}

const HIGH_VIBRATION = 0.55;
const HIGH_TEMPERATURE = 40;

export function builtinVariableOptions(): { value: MachineVariableKey; label: string }[] {
  return [
    { value: "horimeter", label: "Horímetro" },
    { value: "vibration", label: "Vibração" },
    { value: "temperature", label: "Temperatura" },
    { value: "speed", label: "Velocidade Atual" },
    { value: "production", label: "Produção Atual" },
  ];
}

export function variableOptionsForMachine(machine: Machine): { value: MachineVariableKey; label: string }[] {
  return [
    ...builtinVariableOptions(),
    ...machine.customVariables.filter((v) => v.visible).map((v) => ({ value: v.id, label: v.label })),
  ];
}

/**
 * Marca como indisponiveis as variaveis ja escolhidas em outra posicao do mesmo grupo,
 * para a mesma variavel nao aparecer duas vezes no card.
 */
export function disableTakenOptions<T extends { value: string }>(
  options: T[],
  selectedKeys: readonly string[],
  index: number,
): (T & { disabled: boolean })[] {
  const taken = new Set(selectedKeys.filter((_, i) => i !== index));
  return options.map((option) => ({ ...option, disabled: taken.has(option.value) }));
}

export function resolveVariableDisplay(machine: Machine, key: MachineVariableKey): VariableDisplay | null {
  switch (key) {
    case "horimeter":
      return { key, label: "Horímetro", value: `${machine.variables.horimeterHours} hs` };
    case "vibration":
      return { key, label: "Vibração", value: `${machine.variables.vibrationMm.toFixed(2)} mm/s` };
    case "temperature":
      return { key, label: "Temperatura", value: `${machine.variables.temperatureC.toFixed(2)} C` };
    case "speed":
      return { key, label: "Velocidade Atual", value: `${machine.variables.speed} ${machine.variables.speedUnit}` };
    case "production":
      return {
        key,
        label: "Produção Atual",
        value: `${machine.variables.productionAmount} ${machine.variables.productionUnit}`,
      };
    default: {
      const custom = machine.customVariables.find((v) => v.id === key);
      return custom
        ? { key, label: custom.label, value: custom.unit ? `${custom.value} ${custom.unit}` : custom.value }
        : null;
    }
  }
}

export function isVariableHigh(machine: Machine, key: MachineVariableKey): boolean {
  if (key === "vibration") return machine.variables.vibrationMm >= HIGH_VIBRATION;
  if (key === "temperature") return machine.variables.temperatureC >= HIGH_TEMPERATURE;
  return false;
}

export function variableTone(machine: Machine, key: MachineVariableKey): "warning" | "danger" | null {
  if (key === "vibration" && machine.variables.vibrationMm >= HIGH_VIBRATION) return "warning";
  if (key === "temperature" && machine.variables.temperatureC >= HIGH_TEMPERATURE) return "danger";
  return null;
}
