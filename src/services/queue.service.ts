import { Patient } from '../domain/entities/patient.entity.js';
import { PRIORITY_WEIGHT, PRIORITY_EMOJI } from '../domain/enums/priority-level.enum.js';
import { getAllPatients, markPatientAsServed } from './patient.service.js';

/**
 * R03 — Serviço de Gerenciamento da Fila de Atendimento por Prioridade
 *
 * Aplica regras de negócio para priorizar atendimentos conforme a urgência do Protocolo de Manchester
 * e desempata por ordem de chegada (FIFO).
 */

/**
 * Retorna a fila de atendimento atual com os pacientes não atendidos,
 * ordenados estritamente por prioridade (Vermelho -> Laranja -> Amarelo -> Verde -> Azul)
 * e por data/hora de chegada para prioridades idênticas.
 */
export function getTriageQueue(): Patient[] {
  const allPatients = getAllPatients() as Patient[];

  // Filtra apenas pacientes que ainda não foram atendidos
  const unserved = allPatients.filter(p => !p.atendido);

  // Ordenação usando comparador customizado
  return unserved.sort((a, b) => {
    const weightA = PRIORITY_WEIGHT[a.prioridade];
    const weightB = PRIORITY_WEIGHT[b.prioridade];

    // Se as prioridades forem diferentes, ordena por peso de urgência (menor número = maior urgência)
    if (weightA !== weightB) {
      return weightA - weightB;
    }

    // Se a prioridade for idêntica, ordena por data de chegada (FIFO)
    return new Date(a.dataDeChegada).getTime() - new Date(b.dataDeChegada).getTime();
  });
}

/**
 * Chama e atende o próximo paciente de maior prioridade na fila (R03)
 */
export function attendNextPatient(): { success: boolean; patient?: Patient; message: string } {
  const queue = getTriageQueue();

  if (queue.length === 0) {
    return {
      success: false,
      message: 'Não há pacientes aguardando na fila de triagem no momento.'
    };
  }

  // O primeiro paciente da fila ordenada é o de maior prioridade
  const nextInQueue = queue[0];
  const servedPatient = markPatientAsServed(nextInQueue.id);

  if (!servedPatient) {
    return {
      success: false,
      message: 'Erro ao registrar o atendimento do paciente.'
    };
  }

  const emojiPriority = PRIORITY_EMOJI[servedPatient.prioridade] || servedPatient.prioridade;

  return {
    success: true,
    patient: servedPatient,
    message: `Paciente ${servedPatient.nome} (${emojiPriority}) chamado para atendimento!`
  };
}

/**
 * Retorna a posição de um paciente específico na fila (base 1)
 */
export function getPatientQueuePosition(patientId: string): number {
  const queue = getTriageQueue();
  const index = queue.findIndex(p => p.id === patientId || p.cpf.replace(/\D/g, '') === patientId.replace(/\D/g, ''));
  return index !== -1 ? index + 1 : -1;
}
