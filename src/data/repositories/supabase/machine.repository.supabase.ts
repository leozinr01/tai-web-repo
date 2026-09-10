import type { MachineFilters, MachineRepository } from "@/data/contracts/machine.repository";
import type {
  Machine,
  MachineCardSettings,
  MachineCustomVariable,
  MachineLossBreakdown,
  MachineVariableType,
} from "@/domain/entities/machine";
import { MachineStatus } from "@/domain/types/enums";
import { supabase } from "@/lib/supabase-client";
import {
  dbVariableKeyToDomainKey,
  domainVariableKeyToDbKey,
  flagsFromMachineStatus,
  hhmmToMinutes,
  machineCode,
  machineStatusFromFlags,
} from "@/data/repositories/supabase/helpers";

const HIGH_VIBRATION_THRESHOLD = 0.55;
const HIGH_TEMPERATURE_THRESHOLD = 40;

interface MaquinaRow {
  id: number;
  IDsala: string;
  maquina: string | null;
  producao: boolean | null;
  parado: boolean | null;
  emergencia: boolean | null;
  horimetro: number | null;
  idRef: string;
  Temperatura: number | null;
  Vibração: number | null;
  unidProducao: string | null;
  OEE: number | null;
  OEE_disponibilidade: number | null;
  OEE_produtividade: number | null;
  OEE_qualidade: number | null;
  OEE_disp_quebra_falhas: string | null;
  OEE_disp_setup: string | null;
  OEE_disp_ociosidade: string | null;
  OEE_produt_peq_falhas: string | null;
  OEE_produt_qued_veloc: string | null;
  OEE_produt_def_mat_prima: string | null;
  OEE_qualidad_prod_nao_conform: string | null;
  OEE_qualidad_refugo: string | null;
  OEE_qualidad_retrabalho: string | null;
  OEE_Config_Unid_Med: string | null;
  VelocidadeAtual: number | null;
  ProdAtual: number | null;
}

const MAQUINA_COLUMNS = [
  "id",
  "IDsala",
  "maquina",
  "producao",
  "parado",
  "emergencia",
  "horimetro",
  "idRef",
  "Temperatura",
  "Vibração",
  "unidProducao",
  "OEE",
  "OEE_disponibilidade",
  "OEE_produtividade",
  "OEE_qualidade",
  "OEE_disp_quebra_falhas",
  "OEE_disp_setup",
  "OEE_disp_ociosidade",
  "OEE_produt_peq_falhas",
  "OEE_produt_qued_veloc",
  "OEE_produt_def_mat_prima",
  "OEE_qualidad_prod_nao_conform",
  "OEE_qualidad_refugo",
  "OEE_qualidad_retrabalho",
  "OEE_Config_Unid_Med",
  "VelocidadeAtual",
  "ProdAtual",
].join(", ");

interface VariableRow {
  id: number;
  maquina_id: number;
  name: string | null;
  type: string | null;
  grandeza: string | null;
  number_value: string | null;
  bool_value: boolean | null;
}

interface DashboardConfigRow {
  id: string;
  maquina_id: number;
  selection: string[] | null;
  bottom_selection: string[] | null;
  bottom_enabled: boolean[] | null;
  oee_enabled: boolean | null;
  oee_graph_variable: string | null;
}

interface Extras {
  variablesByMachine: Map<number, VariableRow[]>;
  configByMachine: Map<number, DashboardConfigRow>;
  historyByMachine: Map<number, number[]>;
}

async function loadExtras(companyId: string, machineIds: number[]): Promise<Extras> {
  const variablesByMachine = new Map<number, VariableRow[]>();
  const configByMachine = new Map<number, DashboardConfigRow>();
  const historyByMachine = new Map<number, number[]>();
  if (machineIds.length === 0) return { variablesByMachine, configByMachine, historyByMachine };

  const [variablesRes, configsRes, historyRes] = await Promise.all([
    supabase
      .from("variables")
      .select("id, maquina_id, name, type, grandeza, number_value, bool_value")
      .in("maquina_id", machineIds),
    supabase
      .from("dashboard_configs")
      .select("id, maquina_id, selection, bottom_selection, bottom_enabled, oee_enabled, oee_graph_variable")
      .eq("id_empresa", companyId)
      .in("maquina_id", machineIds),
    supabase
      .from("Relatório")
      .select("maquina_id, OEE, created_at")
      .eq("idRef", companyId)
      .in("maquina_id", machineIds)
      .order("created_at", { ascending: false })
      .limit(machineIds.length * 12),
  ]);
  if (variablesRes.error) throw new Error(variablesRes.error.message);
  if (configsRes.error) throw new Error(configsRes.error.message);
  if (historyRes.error) throw new Error(historyRes.error.message);

  for (const row of (variablesRes.data ?? []) as VariableRow[]) {
    const list = variablesByMachine.get(row.maquina_id) ?? [];
    list.push(row);
    variablesByMachine.set(row.maquina_id, list);
  }
  for (const row of (configsRes.data ?? []) as DashboardConfigRow[]) {
    configByMachine.set(row.maquina_id, row);
  }
  const historyDesc = new Map<number, number[]>();
  for (const row of (historyRes.data ?? []) as { maquina_id: number; OEE: number | null }[]) {
    const list = historyDesc.get(row.maquina_id) ?? [];
    if (list.length < 12) list.push(Math.round((row.OEE ?? 0) * 100));
    historyDesc.set(row.maquina_id, list);
  }
  for (const [machineId, list] of historyDesc.entries()) {
    historyByMachine.set(machineId, [...list].reverse());
  }

  return { variablesByMachine, configByMachine, historyByMachine };
}

function toCustomVariable(row: VariableRow): MachineCustomVariable {
  const type = (row.type ?? "float") as MachineVariableType;
  return {
    id: String(row.id),
    label: row.name ?? "",
    type,
    unit: row.grandeza ?? undefined,
    value: type === "bool" ? String(!!row.bool_value) : String(row.number_value ?? "0"),
    visible: true,
  };
}

function defaultCardSettings(): MachineCardSettings {
  return {
    showOeeCircle: true,
    topVariableKeys: ["horimeter", "vibration", "temperature"],
    bottomVariableKeys: ["speed", "production"],
    bottomVariableVisible: [true, true],
  };
}

function toCardSettings(row: DashboardConfigRow | undefined): MachineCardSettings {
  if (!row) return defaultCardSettings();
  const top = (row.selection ?? []).map(dbVariableKeyToDomainKey);
  const bottom = (row.bottom_selection ?? []).map(dbVariableKeyToDomainKey);
  const visible = row.bottom_enabled ?? [true, true];
  const fallback = defaultCardSettings();
  return {
    showOeeCircle: row.oee_enabled ?? true,
    topVariableKeys: [top[0] ?? fallback.topVariableKeys[0], top[1] ?? fallback.topVariableKeys[1], top[2] ?? fallback.topVariableKeys[2]],
    bottomVariableKeys: [bottom[0] ?? fallback.bottomVariableKeys[0], bottom[1] ?? fallback.bottomVariableKeys[1]],
    bottomVariableVisible: [visible[0] ?? true, visible[1] ?? true],
  };
}

function toLossBreakdown(row: MaquinaRow): MachineLossBreakdown {
  return {
    availability: [
      { key: "breakdown", label: "Quebra / Falhas", minutes: hhmmToMinutes(row.OEE_disp_quebra_falhas) },
      { key: "setup", label: "Setup", minutes: hhmmToMinutes(row.OEE_disp_setup) },
      { key: "idle", label: "Ociosidade", minutes: hhmmToMinutes(row.OEE_disp_ociosidade) },
    ],
    productivity: [
      { key: "small_stops", label: "Pequenas Falhas", minutes: hhmmToMinutes(row.OEE_produt_peq_falhas) },
      { key: "reduced_speed", label: "Queda de Velocidade", minutes: hhmmToMinutes(row.OEE_produt_qued_veloc) },
      { key: "raw_material_defect", label: "Defeito Materia Prima", minutes: hhmmToMinutes(row.OEE_produt_def_mat_prima) },
    ],
    quality: [
      { key: "non_conforming_product", label: "Produto Nao Conforme", minutes: hhmmToMinutes(row.OEE_qualidad_prod_nao_conform) },
      { key: "scrap", label: "Refugo", minutes: hhmmToMinutes(row.OEE_qualidad_refugo) },
      { key: "rework", label: "Retrabalho", minutes: hhmmToMinutes(row.OEE_qualidad_retrabalho) },
    ],
  };
}

function toMachine(row: MaquinaRow, extras: Extras): Machine {
  const customVariables = (extras.variablesByMachine.get(row.id) ?? []).map(toCustomVariable);
  const name = row.maquina ?? "";
  return {
    id: String(row.id),
    companyId: row.idRef,
    sectorId: row.IDsala,
    name,
    code: machineCode(name || String(row.id)),
    status: machineStatusFromFlags(row),
    oeePercent: Math.round((row.OEE ?? 0) * 100),
    availabilityPercent: Math.round((row.OEE_disponibilidade ?? 0) * 100),
    productivityPercent: Math.round((row.OEE_produtividade ?? 0) * 100),
    qualityPercent: Math.round((row.OEE_qualidade ?? 0) * 100),
    variables: {
      horimeterHours: row.horimetro ?? 0,
      vibrationMm: row.Vibração ?? 0,
      temperatureC: row.Temperatura ?? 0,
      speed: row.VelocidadeAtual ?? 0,
      speedUnit: "un/min",
      productionAmount: row.ProdAtual ?? 0,
      productionUnit: row.unidProducao ?? row.OEE_Config_Unid_Med ?? "un",
    },
    complementaryCount: customVariables.length,
    oeeHistory: extras.historyByMachine.get(row.id) ?? Array.from({ length: 12 }, () => 0),
    customVariables,
    cardSettings: toCardSettings(extras.configByMachine.get(row.id)),
    lossBreakdown: toLossBreakdown(row),
  };
}

async function syncCustomVariables(machineId: number, customVariables: MachineCustomVariable[]): Promise<void> {
  const { data: existing, error } = await supabase.from("variables").select("id").eq("maquina_id", machineId);
  if (error) throw new Error(error.message);
  const existingIds = new Set((existing ?? []).map((r) => r.id as number));
  const incomingIds = new Set<number>();

  for (const variable of customVariables) {
    const numericId = Number(variable.id);
    const isExisting = Number.isFinite(numericId) && existingIds.has(numericId);
    const payload = {
      maquina_id: machineId,
      name: variable.label,
      type: variable.type,
      grandeza: variable.unit ?? null,
      number_value: variable.type === "bool" ? null : variable.value,
      bool_value: variable.type === "bool" ? variable.value === "true" : null,
    };
    if (isExisting) {
      incomingIds.add(numericId);
      const { error: updateError } = await supabase.from("variables").update(payload).eq("id", numericId);
      if (updateError) throw new Error(updateError.message);
    } else {
      const { error: insertError } = await supabase.from("variables").insert(payload);
      if (insertError) throw new Error(insertError.message);
    }
  }

  const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase.from("variables").delete().in("id", toDelete);
    if (deleteError) throw new Error(deleteError.message);
  }
}

async function upsertCardSettings(companyId: string, machineId: number, cardSettings: MachineCardSettings): Promise<void> {
  const selection = cardSettings.topVariableKeys.map(domainVariableKeyToDbKey);
  const bottomSelection = cardSettings.bottomVariableKeys.map(domainVariableKeyToDbKey);
  const { data: existing, error } = await supabase
    .from("dashboard_configs")
    .select("id, oee_graph_variable")
    .eq("id_empresa", companyId)
    .eq("maquina_id", machineId)
    .maybeSingle();
  if (error) throw new Error(error.message);

  const payload = {
    selection,
    bottom_selection: bottomSelection,
    bottom_enabled: cardSettings.bottomVariableVisible,
    oee_enabled: cardSettings.showOeeCircle,
    oee_graph_variable: existing?.oee_graph_variable ?? selection[0],
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error: updateError } = await supabase.from("dashboard_configs").update(payload).eq("id", existing.id);
    if (updateError) throw new Error(updateError.message);
  } else {
    const { error: insertError } = await supabase
      .from("dashboard_configs")
      .insert({ id_empresa: companyId, maquina_id: machineId, ...payload });
    if (insertError) throw new Error(insertError.message);
  }
}

export class SupabaseMachineRepository implements MachineRepository {
  async listByCompany(companyId: string, filters?: MachineFilters): Promise<Machine[]> {
    let query = supabase.from("Maquinas").select(MAQUINA_COLUMNS).eq("idRef", companyId);
    if (filters?.sectorId) query = query.eq("IDsala", filters.sectorId);
    if (filters?.machineId) query = query.eq("id", Number(filters.machineId));

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as MaquinaRow[];
    const extras = await loadExtras(companyId, rows.map((r) => r.id));

    let machines = rows.map((row) => toMachine(row, extras));
    if (filters?.status) machines = machines.filter((m) => m.status === filters.status);
    if (filters?.highVibration) {
      machines = machines.filter((m) => m.variables.vibrationMm >= HIGH_VIBRATION_THRESHOLD);
    }
    if (filters?.highTemperature) {
      machines = machines.filter((m) => m.variables.temperatureC >= HIGH_TEMPERATURE_THRESHOLD);
    }
    return machines.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getById(id: string): Promise<Machine | null> {
    const { data, error } = await supabase
      .from("Maquinas")
      .select(MAQUINA_COLUMNS)
      .eq("id", Number(id))
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const row = data as unknown as MaquinaRow;
    const extras = await loadExtras(row.idRef, [row.id]);
    return toMachine(row, extras);
  }

  async create(data: { companyId: string; sectorId: string; name: string }): Promise<Machine> {
    const flags = flagsFromMachineStatus(MachineStatus.PARADO);
    const { data: row, error } = await supabase
      .from("Maquinas")
      .insert({
        idRef: data.companyId,
        IDsala: data.sectorId,
        maquina: data.name,
        ...flags,
        horimetro: 0,
        Temperatura: 0,
        Vibração: 0,
        VelocidadeAtual: 0,
        ProdAtual: 0,
        OEE: 0,
        OEE_disponibilidade: 0,
        OEE_produtividade: 0,
        OEE_qualidade: 0,
      })
      .select(MAQUINA_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    const createdRow = row as unknown as MaquinaRow;
    const extras = await loadExtras(data.companyId, [createdRow.id]);
    return toMachine(createdRow, extras);
  }

  async remove(id: string): Promise<void> {
    const numericId = Number(id);
    const { error: variablesError } = await supabase.from("variables").delete().eq("maquina_id", numericId);
    if (variablesError) throw new Error(variablesError.message);
    const { error } = await supabase.from("Maquinas").delete().eq("id", numericId);
    if (error) throw new Error(error.message);
  }

  async update(
    id: string,
    data: Partial<Pick<Machine, "name" | "sectorId" | "customVariables" | "cardSettings">>,
  ): Promise<Machine> {
    const numericId = Number(id);
    const { data: currentRow, error: fetchError } = await supabase
      .from("Maquinas")
      .select("id, idRef")
      .eq("id", numericId)
      .maybeSingle();
    if (fetchError) throw new Error(fetchError.message);
    if (!currentRow) throw new Error("Maquina nao encontrada.");

    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.maquina = data.name;
    if (data.sectorId !== undefined) patch.IDsala = data.sectorId;
    if (Object.keys(patch).length > 0) {
      const { error } = await supabase.from("Maquinas").update(patch).eq("id", numericId);
      if (error) throw new Error(error.message);
    }

    if (data.customVariables !== undefined) {
      await syncCustomVariables(numericId, data.customVariables);
    }
    if (data.cardSettings !== undefined) {
      await upsertCardSettings(currentRow.idRef as string, numericId, data.cardSettings);
    }

    const updated = await this.getById(id);
    if (!updated) throw new Error("Maquina nao encontrada.");
    return updated;
  }

  async updateCardSettingsForAll(companyId: string, cardSettings: MachineCardSettings): Promise<Machine[]> {
    const { data: machines, error } = await supabase.from("Maquinas").select("id").eq("idRef", companyId);
    if (error) throw new Error(error.message);
    const ids = (machines ?? []).map((m) => m.id as number);
    await Promise.all(ids.map((machineId) => upsertCardSettings(companyId, machineId, cardSettings)));
    return this.listByCompany(companyId);
  }
}
