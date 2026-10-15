import { Patient } from '../domain/entities/patient.entity.js';
import { PriorityLevel, PRIORITY_EMOJI } from '../domain/enums/priority-level.enum.js';
import { PriorityCountRecord, ReadonlyPatient } from '../domain/types/utility-types.js';
import { getAllPatients } from './patient.service.js';

/**
 * R04 — Serviço de Consulta, Busca e Geração de Estatísticas da UPA
 *
 * Utiliza métodos avançados de Array: map(), filter(), find(), some(), reduce() e join().
 */

export interface TriageStatistics {
  totalPacientes: number;
  totalAtendidos: number;
  totalAguardando: number;
  idadeMedia: number;
  contagemPorPrioridade: PriorityCountRecord;
  resumoPrioridadesFormatado: string;
}

/**
 * Filtra e lista pacientes por nível de prioridade (R04 - filter, map)
 */
export function listPatientsByPriority(priority: PriorityLevel): ReadonlyPatient[] {
  const all = getAllPatients();
  return all.filter(p => p.prioridade === priority);
}

/**
 * Localiza pacientes específicos pesquisando por ID, Nome, CPF ou Sintomas (R04 - filter, some)
 */
export function searchPatients(query: string): ReadonlyPatient[] {
  if (!query || query.trim().length === 0) {
    return getAllPatients();
  }

  const cleanQuery = query.trim().toLowerCase();
  const digitsOnly = query.replace(/\D/g, '');

  return getAllPatients().filter(patient => {
    const searchFields = [
      patient.id.toLowerCase(),
      patient.nome.toLowerCase(),
      patient.sintomas.toLowerCase(),
      patient.email.toLowerCase()
    ];

    // Verifica se o termo está presente em qualquer dos campos textuais
    const matchesText = searchFields.some(field => field.includes(cleanQuery));

    // Verifica se os dígitos numéricos coincidem com o CPF ou Telefone
    const matchesDigits = digitsOnly.length > 0 && (
      patient.cpf.replace(/\D/g, '').includes(digitsOnly) ||
      patient.telefone.replace(/\D/g, '').includes(digitsOnly)
    );

    return matchesText || matchesDigits;
  });
}

/**
 * Calcula estatísticas e métricas consolidadas sobre o atendimento da UPA (R04 - reduce, map, join)
 */
export function calculateTriageStatistics(): TriageStatistics {
  const allPatients = getAllPatients() as Patient[];

  const totalPacientes = allPatients.length;
  const totalAtendidos = allPatients.filter(p => p.atendido).length;
  const totalAguardando = totalPacientes - totalAtendidos;

  // Cálculo da idade média utilizando reduce()
  const somaIdades = allPatients.reduce((acc, p) => acc + p.idade, 0);
  const idadeMedia = totalPacientes > 0 ? parseFloat((somaIdades / totalPacientes).toFixed(1)) : 0;

  // Contagem de pacientes por cor/prioridade utilizando reduce() e o Utility Type PriorityCountRecord (RA02)
  const contagemPorPrioridade: PriorityCountRecord = allPatients.reduce(
    (acc, p) => {
      acc[p.prioridade] = (acc[p.prioridade] || 0) + 1;
      return acc;
    },
    {
      [PriorityLevel.EMERGENCY]: 0,
      [PriorityLevel.VERY_URGENT]: 0,
      [PriorityLevel.URGENT]: 0,
      [PriorityLevel.STANDARD]: 0,
      [PriorityLevel.NON_URGENT]: 0
    }
  );

  // Formatação amigável das contagens por prioridade utilizando map() e join()
  const resumoPrioridadesFormatado = Object.entries(contagemPorPrioridade)
    .map(([cor, qtd]) => {
      const emojiCor = PRIORITY_EMOJI[cor as PriorityLevel] || cor;
      return `${emojiCor}: ${qtd} paciente(s)`;
    })
    .join(' | ');

  return {
    totalPacientes,
    totalAtendidos,
    totalAguardando,
    idadeMedia,
    contagemPorPrioridade,
    resumoPrioridadesFormatado
  };
}
