export type MotorStatus =
  | "disponivel"
  | "em_uso"
  | "manutencao"
  | "reparo"
  | "sucateado";

export interface MaintenanceDetails {
  started_at: string;
  supplier: string;
  expected_back_at: string;
  quote_file_path: string;
  notes: string;
}

export interface Motor {
  id: number;
  descricao: string;
  marca: string;
  numero_serie: string;
  potencia_cv: number;
  tensao: number;
  corrente: number;
  rpm: number;
  carcaca: string;
  ip_protecao: string;
  status: MotorStatus;
  em_estoque: boolean;
  equipamentos: string[];
  localizacao: string;
  observacoes: string;
  ultima_modificacao: string;
  manutencao: MaintenanceDetails;
  created_at: string;
  updated_at: string;
}

export interface MotorFormData {
  descricao: string;
  marca: string;
  numero_serie: string;
  potencia_cv: number;
  tensao: number;
  corrente: number;
  rpm: number;
  carcaca: string;
  ip_protecao: string;
  status: MotorStatus;
  em_estoque: boolean;
  equipamentos: string[];
  localizacao: string;
  observacoes: string;
}

export interface MotorStats {
  total: number;
  disponiveis: number;
  em_uso: number;
  manutencao: number;
  reparo: number;
  sucateado: number;
  estoque: number;
}

export const STATUS_LABELS: Record<MotorStatus, string> = {
  disponivel: "Disponivel",
  em_uso: "Em uso",
  manutencao: "Manutencao",
  reparo: "Em reparo",
  sucateado: "Sucateado",
};

export const STATUS_COLORS: Record<MotorStatus, string> = {
  disponivel: "border-emerald-200 bg-emerald-100 text-emerald-800",
  em_uso: "border-blue-200 bg-blue-100 text-blue-800",
  manutencao: "border-amber-200 bg-amber-100 text-amber-800",
  reparo: "border-red-200 bg-red-100 text-red-800",
  sucateado: "border-gray-200 bg-gray-100 text-gray-500",
};
