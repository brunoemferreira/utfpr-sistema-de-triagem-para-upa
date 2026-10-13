/**
 * Níveis de prioridade de atendimento na UPA baseados no Protocolo de Manchester
 */
export enum PriorityLevel {
  EMERGENCY = 'VERMELHO',   // Emergência (Atendimento imediato - 0 min)
  VERY_URGENT = 'LARANJA',  // Muito Urgente (Atendimento em até 10 min)
  URGENT = 'AMARELO',       // Urgente (Atendimento em até 60 min)
  STANDARD = 'VERDE',       // Pouco Urgente (Atendimento em até 120 min)
  NON_URGENT = 'AZUL'       // Não Urgente (Atendimento em até 240 min)
}

/**
 * Mapeamento visual das cores do Protocolo de Manchester com Emojis de Prioridade
 */
export const PRIORITY_EMOJI: Record<PriorityLevel, string> = {
  [PriorityLevel.EMERGENCY]: '🔴 VERMELHO',
  [PriorityLevel.VERY_URGENT]: '🟠 LARANJA',
  [PriorityLevel.URGENT]: '🟡 AMARELO',
  [PriorityLevel.STANDARD]: '🟢 VERDE',
  [PriorityLevel.NON_URGENT]: '🔵 AZUL'
};

/**
 * Peso numérico para ordenação da fila (quanto menor o número, maior a prioridade)
 */
export const PRIORITY_WEIGHT: Record<PriorityLevel, number> = {
  [PriorityLevel.EMERGENCY]: 1,
  [PriorityLevel.VERY_URGENT]: 2,
  [PriorityLevel.URGENT]: 3,
  [PriorityLevel.STANDARD]: 4,
  [PriorityLevel.NON_URGENT]: 5
};

/**
 * Tempo máximo de espera recomendado (em minutos)
 */
export const PRIORITY_MAX_WAIT_MINUTES: Record<PriorityLevel, number> = {
  [PriorityLevel.EMERGENCY]: 0,
  [PriorityLevel.VERY_URGENT]: 10,
  [PriorityLevel.URGENT]: 60,
  [PriorityLevel.STANDARD]: 120,
  [PriorityLevel.NON_URGENT]: 240
};
