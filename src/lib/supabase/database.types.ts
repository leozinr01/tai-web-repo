// GERADO AUTOMATICAMENTE a partir do projeto Supabase "TAI" (ref nmoyvzglbzamguzapoag).
// Nao editar a mao — para atualizar, gere novamente via `supabase gen types typescript`
// (ou peca para o Claude regenerar) sempre que o schema do banco mudar.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      alert_contacts: {
        Row: {
          created_at: string | null;
          empresa_id: string;
          envio: string;
          id: string;
          nome: string | null;
          telefone: string;
        };
        Insert: {
          created_at?: string | null;
          empresa_id: string;
          envio?: string;
          id?: string;
          nome?: string | null;
          telefone: string;
        };
        Update: {
          created_at?: string | null;
          empresa_id?: string;
          envio?: string;
          id?: string;
          nome?: string | null;
          telefone?: string;
        };
        Relationships: [];
      };
      alert_events: {
        Row: {
          dia_evento: string | null;
          empresa_nome: string | null;
          empresa_telefone: string | null;
          envio: string | null;
          grandeza: string | null;
          hora_evento: string | null;
          id: string;
          level: string | null;
          maquina: string | null;
          max_val: number | null;
          min_val: number | null;
          sent_at: string | null;
          setor: string | null;
          status: string;
          timeout_min: number | null;
          triggered_at: string;
          value_at_trigger: number | null;
          variable_id: number | null;
          variable_name: string | null;
        };
        Insert: {
          dia_evento?: string | null;
          empresa_nome?: string | null;
          empresa_telefone?: string | null;
          envio?: string | null;
          grandeza?: string | null;
          hora_evento?: string | null;
          id?: string;
          level?: string | null;
          maquina?: string | null;
          max_val?: number | null;
          min_val?: number | null;
          sent_at?: string | null;
          setor?: string | null;
          status?: string;
          timeout_min?: number | null;
          triggered_at?: string;
          value_at_trigger?: number | null;
          variable_id?: number | null;
          variable_name?: string | null;
        };
        Update: {
          dia_evento?: string | null;
          empresa_nome?: string | null;
          empresa_telefone?: string | null;
          envio?: string | null;
          grandeza?: string | null;
          hora_evento?: string | null;
          id?: string;
          level?: string | null;
          maquina?: string | null;
          max_val?: number | null;
          min_val?: number | null;
          sent_at?: string | null;
          setor?: string | null;
          status?: string;
          timeout_min?: number | null;
          triggered_at?: string;
          value_at_trigger?: number | null;
          variable_id?: number | null;
          variable_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "alert_events_variable_id_fkey";
            columns: ["variable_id"];
            isOneToOne: false;
            referencedRelation: "variables";
            referencedColumns: ["id"];
          },
        ];
      };
      Apontamentos: {
        Row: {
          apontamento: string | null;
          created_at: string;
          data_lancamento: string | null;
          fim_parada: string | null;
          hora_lancamento: string | null;
          id: number;
          idMaquina: string | null;
          idRef: string | null;
          inicio_parada: string | null;
          lançador: string | null;
          OEE: string | null;
          seguimento_OEE: string | null;
          Setor: string | null;
          tempo_parada: string | null;
        };
        Insert: {
          apontamento?: string | null;
          created_at?: string;
          data_lancamento?: string | null;
          fim_parada?: string | null;
          hora_lancamento?: string | null;
          id?: number;
          idMaquina?: string | null;
          idRef?: string | null;
          inicio_parada?: string | null;
          lançador?: string | null;
          OEE?: string | null;
          seguimento_OEE?: string | null;
          Setor?: string | null;
          tempo_parada?: string | null;
        };
        Update: {
          apontamento?: string | null;
          created_at?: string;
          data_lancamento?: string | null;
          fim_parada?: string | null;
          hora_lancamento?: string | null;
          id?: number;
          idMaquina?: string | null;
          idRef?: string | null;
          inicio_parada?: string | null;
          lançador?: string | null;
          OEE?: string | null;
          seguimento_OEE?: string | null;
          Setor?: string | null;
          tempo_parada?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "Apontamentos_idRef_fkey";
            columns: ["idRef"];
            isOneToOne: false;
            referencedRelation: "Empresas";
            referencedColumns: ["idEmpresa"];
          },
        ];
      };
      dashboard_configs: {
        Row: {
          bottom_enabled: boolean[] | null;
          bottom_selection: string[] | null;
          created_at: string | null;
          id: string;
          id_empresa: string | null;
          maquina_id: number | null;
          oee_enabled: boolean | null;
          oee_graph_variable: string | null;
          selection: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          bottom_enabled?: boolean[] | null;
          bottom_selection?: string[] | null;
          created_at?: string | null;
          id?: string;
          id_empresa?: string | null;
          maquina_id?: number | null;
          oee_enabled?: boolean | null;
          oee_graph_variable?: string | null;
          selection?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          bottom_enabled?: boolean[] | null;
          bottom_selection?: string[] | null;
          created_at?: string | null;
          id?: string;
          id_empresa?: string | null;
          maquina_id?: number | null;
          oee_enabled?: boolean | null;
          oee_graph_variable?: string | null;
          selection?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "dashboard_configs_id_empresa_fkey";
            columns: ["id_empresa"];
            isOneToOne: false;
            referencedRelation: "Empresas";
            referencedColumns: ["idEmpresa"];
          },
          {
            foreignKeyName: "dashboard_configs_maquina_id_fkey";
            columns: ["maquina_id"];
            isOneToOne: false;
            referencedRelation: "Maquinas";
            referencedColumns: ["id"];
          },
        ];
      };
      Empresas: {
        Row: {
          assinatura: string | null;
          CEP: string | null;
          cidade: string | null;
          cnpj: string | null;
          created_at: string;
          endereco: string | null;
          estado: string | null;
          id: number;
          idEmpresa: string | null;
          logo_url: string | null;
          nome: string | null;
          responsavel: string | null;
          telefone: string | null;
        };
        Insert: {
          assinatura?: string | null;
          CEP?: string | null;
          cidade?: string | null;
          cnpj?: string | null;
          created_at?: string;
          endereco?: string | null;
          estado?: string | null;
          id?: number;
          idEmpresa?: string | null;
          logo_url?: string | null;
          nome?: string | null;
          responsavel?: string | null;
          telefone?: string | null;
        };
        Update: {
          assinatura?: string | null;
          CEP?: string | null;
          cidade?: string | null;
          cnpj?: string | null;
          created_at?: string;
          endereco?: string | null;
          estado?: string | null;
          id?: number;
          idEmpresa?: string | null;
          logo_url?: string | null;
          nome?: string | null;
          responsavel?: string | null;
          telefone?: string | null;
        };
        Relationships: [];
      };
      Maquinas: {
        Row: {
          created_at: string;
          emergencia: boolean | null;
          horimetro: number | null;
          id: number;
          idRef: string | null;
          idRefOEE: string | null;
          IDsala: string;
          maquina: string | null;
          OEE: number | null;
          OEE_Config_horas_Prod_prog: string | null;
          OEE_Config_Qnt_Produzida: number | null;
          OEE_Config_Tempo_Produz_seg: number | null;
          OEE_Config_Unid_Med: string | null;
          OEE_disp_ociosidade: string | null;
          OEE_disp_quebra_falhas: string | null;
          OEE_disp_setup: string | null;
          OEE_disponibilidade: number | null;
          OEE_produt_def_mat_prima: string | null;
          OEE_produt_peq_falhas: string | null;
          OEE_produt_qued_veloc: string | null;
          OEE_produtividade: number | null;
          OEE_qualidad_prod_nao_conform: string | null;
          OEE_qualidad_refugo: string | null;
          OEE_qualidad_retrabalho: string | null;
          OEE_qualidade: number | null;
          parado: boolean | null;
          perdaProducao: number | null;
          ProdAtual: number | null;
          producao: boolean | null;
          Temperatura: number | null;
          temperaturaAlta: boolean | null;
          temperaturaMax: number | null;
          Tempo_produtivo: number | null;
          turno: string | null;
          unidPerda: string | null;
          unidProducao: string | null;
          VelocidadeAtual: number | null;
          VelocidadeMax: number | null;
          Vibração: number | null;
          vibracaoAlta: boolean | null;
          vibracaoMax: number | null;
        };
        Insert: {
          created_at?: string;
          emergencia?: boolean | null;
          horimetro?: number | null;
          id?: number;
          idRef?: string | null;
          idRefOEE?: string | null;
          IDsala: string;
          maquina?: string | null;
          OEE?: number | null;
          OEE_Config_horas_Prod_prog?: string | null;
          OEE_Config_Qnt_Produzida?: number | null;
          OEE_Config_Tempo_Produz_seg?: number | null;
          OEE_Config_Unid_Med?: string | null;
          OEE_disp_ociosidade?: string | null;
          OEE_disp_quebra_falhas?: string | null;
          OEE_disp_setup?: string | null;
          OEE_disponibilidade?: number | null;
          OEE_produt_def_mat_prima?: string | null;
          OEE_produt_peq_falhas?: string | null;
          OEE_produt_qued_veloc?: string | null;
          OEE_produtividade?: number | null;
          OEE_qualidad_prod_nao_conform?: string | null;
          OEE_qualidad_refugo?: string | null;
          OEE_qualidad_retrabalho?: string | null;
          OEE_qualidade?: number | null;
          parado?: boolean | null;
          perdaProducao?: number | null;
          ProdAtual?: number | null;
          producao?: boolean | null;
          Temperatura?: number | null;
          temperaturaAlta?: boolean | null;
          temperaturaMax?: number | null;
          Tempo_produtivo?: number | null;
          turno?: string | null;
          unidPerda?: string | null;
          unidProducao?: string | null;
          VelocidadeAtual?: number | null;
          VelocidadeMax?: number | null;
          Vibração?: number | null;
          vibracaoAlta?: boolean | null;
          vibracaoMax?: number | null;
        };
        Update: {
          created_at?: string;
          emergencia?: boolean | null;
          horimetro?: number | null;
          id?: number;
          idRef?: string | null;
          idRefOEE?: string | null;
          IDsala?: string;
          maquina?: string | null;
          OEE?: number | null;
          OEE_Config_horas_Prod_prog?: string | null;
          OEE_Config_Qnt_Produzida?: number | null;
          OEE_Config_Tempo_Produz_seg?: number | null;
          OEE_Config_Unid_Med?: string | null;
          OEE_disp_ociosidade?: string | null;
          OEE_disp_quebra_falhas?: string | null;
          OEE_disp_setup?: string | null;
          OEE_disponibilidade?: number | null;
          OEE_produt_def_mat_prima?: string | null;
          OEE_produt_peq_falhas?: string | null;
          OEE_produt_qued_veloc?: string | null;
          OEE_produtividade?: number | null;
          OEE_qualidad_prod_nao_conform?: string | null;
          OEE_qualidad_refugo?: string | null;
          OEE_qualidad_retrabalho?: string | null;
          OEE_qualidade?: number | null;
          parado?: boolean | null;
          perdaProducao?: number | null;
          ProdAtual?: number | null;
          producao?: boolean | null;
          Temperatura?: number | null;
          temperaturaAlta?: boolean | null;
          temperaturaMax?: number | null;
          Tempo_produtivo?: number | null;
          turno?: string | null;
          unidPerda?: string | null;
          unidProducao?: string | null;
          VelocidadeAtual?: number | null;
          VelocidadeMax?: number | null;
          Vibração?: number | null;
          vibracaoAlta?: boolean | null;
          vibracaoMax?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "Maquinas_idRef_fkey";
            columns: ["idRef"];
            isOneToOne: false;
            referencedRelation: "Empresas";
            referencedColumns: ["idEmpresa"];
          },
          {
            foreignKeyName: "Maquinas_IDsala_fkey";
            columns: ["IDsala"];
            isOneToOne: false;
            referencedRelation: "Sala";
            referencedColumns: ["sala"];
          },
        ];
      };
      "OEE geral": {
        Row: {
          created_at: string;
          Disponibilidade: number | null;
          id: number;
          idRef: string | null;
          OEE: number | null;
          Produtividade: number | null;
          Qualidade: number | null;
          Tempo_produtivo: number | null;
        };
        Insert: {
          created_at?: string;
          Disponibilidade?: number | null;
          id?: number;
          idRef?: string | null;
          OEE?: number | null;
          Produtividade?: number | null;
          Qualidade?: number | null;
          Tempo_produtivo?: number | null;
        };
        Update: {
          created_at?: string;
          Disponibilidade?: number | null;
          id?: number;
          idRef?: string | null;
          OEE?: number | null;
          Produtividade?: number | null;
          Qualidade?: number | null;
          Tempo_produtivo?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "OEE geral_idRef_fkey";
            columns: ["idRef"];
            isOneToOne: false;
            referencedRelation: "Empresas";
            referencedColumns: ["idEmpresa"];
          },
        ];
      };
      "Ordem de serviço": {
        Row: {
          artefatos: string | null;
          created_at: string;
          data: string | null;
          "data execucao": string | null;
          Executor: string | null;
          ferramentas: string | null;
          id: number;
          idMaquina: string;
          idRef: string | null;
          numOrdem: number | null;
          periodicidade: string | null;
          proxima_execucao: string | null;
          servico: string | null;
          setor: string | null;
          status: string | null;
        };
        Insert: {
          artefatos?: string | null;
          created_at?: string;
          data?: string | null;
          "data execucao"?: string | null;
          Executor?: string | null;
          ferramentas?: string | null;
          id?: number;
          idMaquina: string;
          idRef?: string | null;
          numOrdem?: number | null;
          periodicidade?: string | null;
          proxima_execucao?: string | null;
          servico?: string | null;
          setor?: string | null;
          status?: string | null;
        };
        Update: {
          artefatos?: string | null;
          created_at?: string;
          data?: string | null;
          "data execucao"?: string | null;
          Executor?: string | null;
          ferramentas?: string | null;
          id?: number;
          idMaquina?: string;
          idRef?: string | null;
          numOrdem?: number | null;
          periodicidade?: string | null;
          proxima_execucao?: string | null;
          servico?: string | null;
          setor?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "Ordem de serviço_idRef_fkey";
            columns: ["idRef"];
            isOneToOne: false;
            referencedRelation: "Empresas";
            referencedColumns: ["idEmpresa"];
          },
        ];
      };
      Relatório: {
        Row: {
          created_at: string | null;
          date: string | null;
          hora: string | null;
          id: number;
          idRef: string | null;
          IDsala: string | null;
          maquina: string | null;
          maquina_id: number | null;
          OEE: number | null;
          OEE_disponibilidade: number | null;
          OEE_produtividade: number | null;
          OEE_qualidade: number | null;
          status_maquina: string | null;
          variables: Json | null;
        };
        Insert: {
          created_at?: string | null;
          date?: string | null;
          hora?: string | null;
          id?: number;
          idRef?: string | null;
          IDsala?: string | null;
          maquina?: string | null;
          maquina_id?: number | null;
          OEE?: number | null;
          OEE_disponibilidade?: number | null;
          OEE_produtividade?: number | null;
          OEE_qualidade?: number | null;
          status_maquina?: string | null;
          variables?: Json | null;
        };
        Update: {
          created_at?: string | null;
          date?: string | null;
          hora?: string | null;
          id?: number;
          idRef?: string | null;
          IDsala?: string | null;
          maquina?: string | null;
          maquina_id?: number | null;
          OEE?: number | null;
          OEE_disponibilidade?: number | null;
          OEE_produtividade?: number | null;
          OEE_qualidade?: number | null;
          status_maquina?: string | null;
          variables?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "Relatório_idRef_fkey";
            columns: ["idRef"];
            isOneToOne: false;
            referencedRelation: "Empresas";
            referencedColumns: ["idEmpresa"];
          },
        ];
      };
      Sala: {
        Row: {
          created_at: string;
          id: number;
          idRef: string;
          maq_emergencia: number | null;
          maq_parada: number | null;
          maq_producao: number | null;
          sala: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          idRef: string;
          maq_emergencia?: number | null;
          maq_parada?: number | null;
          maq_producao?: number | null;
          sala: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          idRef?: string;
          maq_emergencia?: number | null;
          maq_parada?: number | null;
          maq_producao?: number | null;
          sala?: string;
        };
        Relationships: [
          {
            foreignKeyName: "Sala_idRef_fkey";
            columns: ["idRef"];
            isOneToOne: false;
            referencedRelation: "Empresas";
            referencedColumns: ["idEmpresa"];
          },
        ];
      };
      User: {
        Row: {
          cidade: string | null;
          created_at: string;
          email: string | null;
          estado: string | null;
          id: number;
          idEmpresa: string | null;
          idRef: string | null;
          key: string | null;
          nomeE: string | null;
          nomeUser: string | null;
          Status: string | null;
          telefone: string | null;
          tipo: string | null;
        };
        Insert: {
          cidade?: string | null;
          created_at?: string;
          email?: string | null;
          estado?: string | null;
          id?: number;
          idEmpresa?: string | null;
          idRef?: string | null;
          key?: string | null;
          nomeE?: string | null;
          nomeUser?: string | null;
          Status?: string | null;
          telefone?: string | null;
          tipo?: string | null;
        };
        Update: {
          cidade?: string | null;
          created_at?: string;
          email?: string | null;
          estado?: string | null;
          id?: number;
          idEmpresa?: string | null;
          idRef?: string | null;
          key?: string | null;
          nomeE?: string | null;
          nomeUser?: string | null;
          Status?: string | null;
          telefone?: string | null;
          tipo?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "User_idEmpresa_fkey";
            columns: ["idEmpresa"];
            isOneToOne: false;
            referencedRelation: "Empresas";
            referencedColumns: ["idEmpresa"];
          },
        ];
      };
      variables: {
        Row: {
          alert_count: number | null;
          back_in_range_since: string | null;
          bool_value: boolean | null;
          created_at: string;
          grandeza: string | null;
          id: number;
          last_alert_at: string | null;
          level: string | null;
          maquina_id: number | null;
          max_val: number | null;
          min_val: number | null;
          name: string | null;
          number_value: number | null;
          out_of_range_since: string | null;
          timeout_min: number | null;
          type: string | null;
        };
        Insert: {
          alert_count?: number | null;
          back_in_range_since?: string | null;
          bool_value?: boolean | null;
          created_at?: string;
          grandeza?: string | null;
          id?: number;
          last_alert_at?: string | null;
          level?: string | null;
          maquina_id?: number | null;
          max_val?: number | null;
          min_val?: number | null;
          name?: string | null;
          number_value?: number | null;
          out_of_range_since?: string | null;
          timeout_min?: number | null;
          type?: string | null;
        };
        Update: {
          alert_count?: number | null;
          back_in_range_since?: string | null;
          bool_value?: boolean | null;
          created_at?: string;
          grandeza?: string | null;
          id?: number;
          last_alert_at?: string | null;
          level?: string | null;
          maquina_id?: number | null;
          max_val?: number | null;
          min_val?: number | null;
          name?: string | null;
          number_value?: number | null;
          out_of_range_since?: string | null;
          timeout_min?: number | null;
          type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "variables_maquina_id_fkey";
            columns: ["maquina_id"];
            isOneToOne: false;
            referencedRelation: "Maquinas";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      atualizar_oee_disponibilidade: { Args: never; Returns: undefined };
      atualizar_oee_produtividade: { Args: never; Returns: undefined };
      atualizar_oee_qualidade: { Args: never; Returns: undefined };
      atualizar_status_por_data_execucao: { Args: never; Returns: undefined };
      atualizar_valores_maquinas: { Args: never; Returns: undefined };
      atualizar_variaveis_maquinas: { Args: never; Returns: undefined };
      calcular_oee: { Args: never; Returns: undefined };
      calcular_oee_geral: { Args: never; Returns: undefined };
      calcular_tempo_produtivo: { Args: never; Returns: undefined };
      check_thresholds: { Args: never; Returns: undefined };
      copiar_dados_maquinas_para_relatorio: { Args: never; Returns: undefined };
      soma_tempo_parada: { Args: never; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database["public"];

export type Tables<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Update"];
