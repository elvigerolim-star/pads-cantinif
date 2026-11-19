export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      aluno: {
        Row: {
          criado_em: string
          email: string
          id: string
          matricula: string
          nome: string
        }
        Insert: {
          criado_em?: string
          email: string
          id: string
          matricula: string
          nome: string
        }
        Update: {
          criado_em?: string
          email?: string
          id?: string
          matricula?: string
          nome?: string
        }
        Relationships: []
      }
      funcionario: {
        Row: {
          criado_em: string
          email: string
          funcao: Database["public"]["Enums"]["funcao_funcionario"]
          id: string
          nome: string
          usuario: string
        }
        Insert: {
          criado_em?: string
          email: string
          funcao?: Database["public"]["Enums"]["funcao_funcionario"]
          id: string
          nome: string
          usuario: string
        }
        Update: {
          criado_em?: string
          email?: string
          funcao?: Database["public"]["Enums"]["funcao_funcionario"]
          id?: string
          nome?: string
          usuario?: string
        }
        Relationships: []
      }
      item_pedido: {
        Row: {
          id_pedido: string
          id_produto: string
          preco_unitario: number
          quantidade: number
        }
        Insert: {
          id_pedido: string
          id_produto: string
          preco_unitario: number
          quantidade: number
        }
        Update: {
          id_pedido?: string
          id_produto?: string
          preco_unitario?: number
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "item_pedido_id_pedido_fkey"
            columns: ["id_pedido"]
            isOneToOne: false
            referencedRelation: "pedido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_pedido_id_produto_fkey"
            columns: ["id_produto"]
            isOneToOne: false
            referencedRelation: "produto"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamento: {
        Row: {
          confirmado_em: string | null
          id: string
          id_pedido: string
          referencia_pix: string
          solicitado_em: string
          status: Database["public"]["Enums"]["status_pagamento"]
          valor: number
        }
        Insert: {
          confirmado_em?: string | null
          id?: string
          id_pedido: string
          referencia_pix: string
          solicitado_em?: string
          status?: Database["public"]["Enums"]["status_pagamento"]
          valor: number
        }
        Update: {
          confirmado_em?: string | null
          id?: string
          id_pedido?: string
          referencia_pix?: string
          solicitado_em?: string
          status?: Database["public"]["Enums"]["status_pagamento"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamento_id_pedido_fkey"
            columns: ["id_pedido"]
            isOneToOne: true
            referencedRelation: "pedido"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido: {
        Row: {
          atualizado_em: string
          chamado_em: string | null
          chave_conferencia: string
          criado_em: string
          id: string
          id_aluno: string
          id_atendente: string | null
          motivo_cancelamento:
            | Database["public"]["Enums"]["motivo_cancelamento"]
            | null
          numero: number
          retirado_em: string | null
          senha_retirada: string
          status: Database["public"]["Enums"]["status_pedido"]
        }
        Insert: {
          atualizado_em?: string
          chamado_em?: string | null
          chave_conferencia: string
          criado_em?: string
          id?: string
          id_aluno: string
          id_atendente?: string | null
          motivo_cancelamento?:
            | Database["public"]["Enums"]["motivo_cancelamento"]
            | null
          numero?: never
          retirado_em?: string | null
          senha_retirada: string
          status?: Database["public"]["Enums"]["status_pedido"]
        }
        Update: {
          atualizado_em?: string
          chamado_em?: string | null
          chave_conferencia?: string
          criado_em?: string
          id?: string
          id_aluno?: string
          id_atendente?: string | null
          motivo_cancelamento?:
            | Database["public"]["Enums"]["motivo_cancelamento"]
            | null
          numero?: never
          retirado_em?: string | null
          senha_retirada?: string
          status?: Database["public"]["Enums"]["status_pedido"]
        }
        Relationships: [
          {
            foreignKeyName: "pedido_id_aluno_fkey"
            columns: ["id_aluno"]
            isOneToOne: false
            referencedRelation: "aluno"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_id_atendente_fkey"
            columns: ["id_atendente"]
            isOneToOne: false
            referencedRelation: "funcionario"
            referencedColumns: ["id"]
          },
        ]
      }
      produto: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_produto"]
          descricao: string | null
          disponivel: boolean
          id: string
          nome: string
          ordem: number
          preco_atual: number
          preco_demonstrativo: boolean
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_produto"]
          descricao?: string | null
          disponivel?: boolean
          id?: string
          nome: string
          ordem?: number
          preco_atual: number
          preco_demonstrativo?: boolean
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_produto"]
          descricao?: string | null
          disponivel?: boolean
          id?: string
          nome?: string
          ordem?: number
          preco_atual?: number
          preco_demonstrativo?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _codigo_janela: {
        Args: { _chave: string; _janela: number }
        Returns: string
      }
      chamar_senha: { Args: { p_pedido: string }; Returns: string }
      codigo_retirada: { Args: { p_pedido: string }; Returns: Json }
      conferir_pedido: {
        Args: { p_disponivel: boolean; p_pedido: string }
        Returns: string
      }
      conferir_retirada: {
        Args: { p_codigo: string; p_pedido: string }
        Returns: Json
      }
      criar_pedido: { Args: { p_itens: Json }; Returns: string }
      definir_disponibilidade: {
        Args: { p_disponivel: boolean; p_produto: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      marcar_pronto: { Args: { p_pedido: string }; Returns: string }
      simular_pagamento: {
        Args: { p_aprovado: boolean; p_pedido: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "aluno" | "atendente"
      categoria_produto: "salgado" | "bebida" | "doce"
      funcao_funcionario: "atendente"
      motivo_cancelamento: "itens_indisponiveis" | "pagamento_falhou"
      status_pagamento: "pendente" | "confirmado" | "falhou"
      status_pedido:
        | "recebido"
        | "aguardando_pagamento"
        | "em_separacao"
        | "pronto"
        | "entregue"
        | "cancelado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["aluno", "atendente"],
      categoria_produto: ["salgado", "bebida", "doce"],
      funcao_funcionario: ["atendente"],
      motivo_cancelamento: ["itens_indisponiveis", "pagamento_falhou"],
      status_pagamento: ["pendente", "confirmado", "falhou"],
      status_pedido: [
        "recebido",
        "aguardando_pagamento",
        "em_separacao",
        "pronto",
        "entregue",
        "cancelado",
      ],
    },
  },
} as const
