import { Patient } from '../entities/patient.entity.js';
import { PriorityLevel } from '../enums/priority-level.enum.js';

/**
 * RA02 — Aplicação dos Utility Types do TypeScript
 *
 * 1. Omit: Remove campos gerados internamente pelo sistema no momento do cadastro inicial.
 * 2. Partial: Torna todos os campos opcionais para atualizações cadastrais flexíveis.
 * 3. Pick: Seleciona apenas os campos essenciais para exibição resumida em listagens/filas.
 * 4. Readonly: Define um tipo imutável para garantir integridade em operações somente leitura.
 * 5. Record: Mapeia cada nível de prioridade para valores acumulados em relatórios e estatísticas.
 */

// DTO para cadastro inicial (omite ID, prioridade, data de chegada e status de atendimento gerados pelo sistema)
export type PatientRegistrationDTO = Omit<Patient, 'id' | 'dataDeChegada' | 'prioridade' | 'atendido' | 'dataAtendimento'>;

// DTO para atualização cadastral parcial (todos os campos editáveis tornam-se opcionais)
export type PatientUpdateDTO = Partial<Omit<Patient, 'id' | 'dataDeChegada'>>;

// DTO de resumo para rápida visualização em filas e relatórios
export type PatientSummaryDTO = Pick<Patient, 'id' | 'nome' | 'idade' | 'prioridade' | 'sintomas' | 'atendido'>;

// Tipo imutável de paciente para garantir segurança de dados em consultas
export type ReadonlyPatient = Readonly<Patient>;

// Mapeamento de contadores de pacientes por nível de prioridade
export type PriorityCountRecord = Record<PriorityLevel, number>;
