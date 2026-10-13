import { PriorityLevel } from '../enums/priority-level.enum.js';

/**
 * Entidade de Domínio representando um Paciente na UPA (R05)
 */
export interface Patient {
  id: string;
  nome: string;
  idade: number;
  cpf: string;
  telefone: string;
  email: string;
  sintomas: string;
  dataDeChegada: Date;
  prioridade: PriorityLevel;
  atendido: boolean;
  dataAtendimento?: Date;
}
