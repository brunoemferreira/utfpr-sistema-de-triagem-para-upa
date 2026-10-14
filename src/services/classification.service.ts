import { match, P } from 'ts-pattern';
import { PriorityLevel } from '../domain/enums/priority-level.enum.js';

/**
 * RA03 — Motor de Classificação de Risco utilizando Pattern Matching (`ts-pattern`)
 *
 * Analisa os sintomas declarados pelo paciente (e/ou parâmetros de triagem)
 * e determina o Nível de Urgência de acordo com o Protocolo de Manchester.
 */

// Palavras-chave para parada/emergência grave (VERMELHO)
const EMERGENCY_KEYWORDS = [
  'parada', 'cardiorrespiratoria', 'inconsciente', 'sem pulso', 'sem respiracao',
  'convulsao', 'hemorragia severa', 'infarto', 'anofilatico', 'choque'
];

// Palavras-chave para muito urgente (LARANJA)
const VERY_URGENT_KEYWORDS = [
  'dor no peito', 'falta de ar severa', 'queimadura grave', 'fratura exposta',
  'avc', 'paralisia', 'desmaio', 'hemorragia', 'confusao mental'
];

// Palavras-chave para urgente (AMARELO)
const URGENT_KEYWORDS = [
  'febre alta', 'dor moderada', 'vomito persistente', 'crise de asma',
  'fratura', 'hipertensao', 'pressao alta', 'colica renal', 'diarreia grave'
];

// Palavras-chave para pouco urgente (VERDE)
const STANDARD_KEYWORDS = [
  'febre baixa', 'dor leve', 'tosse', 'resfriado', 'gripe',
  'nausea', 'ferimento leve', 'dor de cabeca', 'garganta inflamada'
];

// Palavras-chave para não urgente (AZUL)
const NON_URGENT_KEYWORDS = [
  'troca de curativo', 'renovacao de receita', 'atestado',
  'exame', 'rotina', 'remocao de pontos', 'consulta preventiva'
];

/**
 * Função utilitária para verificar se a string contém alguma das palavras-chave
 */
function containsKeyword(text: string, keywords: string[]): boolean {
  const normalizedText = text.toLowerCase();
  return keywords.some(kw => normalizedText.includes(kw));
}

/**
 * Classifica a prioridade do paciente utilizando o Pattern Matching declarativo da `ts-pattern`
 */
export function classifyPatientRisk(symptoms: string, explicitPriority?: PriorityLevel): PriorityLevel {
  // Se uma prioridade explícita já foi atribuída manualmente pelo enfermeiro, respeita a atribuição
  if (explicitPriority && Object.values(PriorityLevel).includes(explicitPriority)) {
    return explicitPriority;
  }

  const sanitizedSymptoms = symptoms ? symptoms.trim().toLowerCase() : '';

  // Aplicação avançada do `ts-pattern` com `match` e `P.when`
  return match(sanitizedSymptoms)
    .with(P.when(s => containsKeyword(s, EMERGENCY_KEYWORDS)), () => PriorityLevel.EMERGENCY)
    .with(P.when(s => containsKeyword(s, VERY_URGENT_KEYWORDS)), () => PriorityLevel.VERY_URGENT)
    .with(P.when(s => containsKeyword(s, URGENT_KEYWORDS)), () => PriorityLevel.URGENT)
    .with(P.when(s => containsKeyword(s, NON_URGENT_KEYWORDS)), () => PriorityLevel.NON_URGENT)
    .with(P.when(s => containsKeyword(s, STANDARD_KEYWORDS)), () => PriorityLevel.STANDARD)
    .otherwise(() => PriorityLevel.STANDARD); // Fallback seguro para Pouco Urgente
}

/**
 * Retorna uma descrição textual amigável do tempo de atendimento esperado por prioridade
 */
export function getPriorityDescription(priority: PriorityLevel): string {
  return match(priority)
    .with(PriorityLevel.EMERGENCY, () => '🔴 VERMELHO - Emergência: Atendimento imediato (0 min)')
    .with(PriorityLevel.VERY_URGENT, () => '🟠 LARANJA - Muito Urgente: Atendimento em até 10 minutos')
    .with(PriorityLevel.URGENT, () => '🟡 AMARELO - Urgente: Atendimento em até 60 minutos')
    .with(PriorityLevel.STANDARD, () => '🟢 VERDE - Pouco Urgente: Atendimento em até 120 minutos')
    .with(PriorityLevel.NON_URGENT, () => '🔵 AZUL - Não Urgente: Atendimento em até 240 minutos')
    .exhaustive(); // Garantia em tempo de compilação de que todos os enums foram contemplados
}
