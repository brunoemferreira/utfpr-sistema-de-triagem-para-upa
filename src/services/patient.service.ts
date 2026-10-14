import { Patient } from '../domain/entities/patient.entity.js';
import { PriorityLevel } from '../domain/enums/priority-level.enum.js';
import { PatientRegistrationDTO, PatientUpdateDTO, ReadonlyPatient } from '../domain/types/utility-types.js';
import { validatePatientRegistration, validateCpf, validateTelefone, validateEmail, validateNome, validateIdade } from '../validators/patient.validator.js';
import { classifyPatientRisk } from './classification.service.js';

/**
 * R01 & R02 — Serviço de Cadastro e Gerenciamento de Pacientes
 * Módulo independente utilizando funções puras e reutilizáveis.
 */

// Armazenamento em memória dos pacientes cadastrados
const patientStore: Patient[] = [];

// Contador sequencial para IDs amigáveis
let sequenceId = 1;

/**
 * Cadastra um novo paciente no sistema (R01)
 */
export function registerPatient(
  dto: PatientRegistrationDTO,
  explicitPriority?: PriorityLevel
): { success: boolean; patient?: Patient; errors?: string[] } {
  // Validação de dados via Expressões Regulares (RA01)
  const validation = validatePatientRegistration(dto);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  // Verifica duplicação de CPF
  const cleanedCpf = dto.cpf.replace(/\D/g, '');
  const existingPatient = patientStore.find(p => p.cpf.replace(/\D/g, '') === cleanedCpf);
  if (existingPatient) {
    return { success: false, errors: [`CPF ${dto.cpf} já cadastrado para o paciente ${existingPatient.nome}.`] };
  }

  // Classificação automática de risco com ts-pattern (R03, RA03)
  const priority = classifyPatientRisk(dto.sintomas, explicitPriority);

  const newPatient: Patient = {
    id: `PAC-${String(sequenceId++).padStart(4, '0')}`,
    nome: dto.nome.trim(),
    idade: dto.idade,
    cpf: dto.cpf.trim(),
    telefone: dto.telefone.trim(),
    email: dto.email.trim(),
    sintomas: dto.sintomas.trim(),
    dataDeChegada: new Date(),
    prioridade: priority,
    atendido: false
  };

  patientStore.push(newPatient);

  return {
    success: true,
    patient: { ...newPatient }
  };
}

/**
 * Atualiza as informações de um paciente cadastrado (R01, RA02)
 */
export function updatePatient(
  id: string,
  updates: PatientUpdateDTO
): { success: boolean; patient?: Patient; errors?: string[] } {
  const patientIndex = patientStore.findIndex(p => p.id === id || p.cpf.replace(/\D/g, '') === id.replace(/\D/g, ''));
  if (patientIndex === -1) {
    return { success: false, errors: [`Paciente com identificador '${id}' não encontrado.`] };
  }

  const existing = patientStore[patientIndex];
  const errors: string[] = [];

  // Validação dos campos fornecidos para atualização
  if (updates.nome !== undefined && !validateNome(updates.nome)) {
    errors.push('Nome para atualização é inválido.');
  }

  if (updates.idade !== undefined && !validateIdade(updates.idade)) {
    errors.push('Idade para atualização é inválida.');
  }

  if (updates.telefone !== undefined && !validateTelefone(updates.telefone)) {
    errors.push('Telefone para atualização é inválido.');
  }

  if (updates.email !== undefined && !validateEmail(updates.email)) {
    errors.push('E-mail para atualização é inválido.');
  }

  if (updates.cpf !== undefined && !validateCpf(updates.cpf)) {
    errors.push('CPF para atualização é inválido.');
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Atualização dos campos informados
  const updatedPatient: Patient = {
    ...existing,
    ...updates,
    nome: updates.nome ? updates.nome.trim() : existing.nome,
    sintomas: updates.sintomas ? updates.sintomas.trim() : existing.sintomas
  };

  // Se os sintomas foram alterados e a prioridade não foi informada explicitamente, reclassifica o risco
  if (updates.sintomas && !updates.prioridade) {
    updatedPatient.prioridade = classifyPatientRisk(updatedPatient.sintomas);
  }

  patientStore[patientIndex] = updatedPatient;

  return {
    success: true,
    patient: { ...updatedPatient }
  };
}

/**
 * Localiza um paciente por ID ou CPF
 */
export function findPatientByIdOrCpf(identifier: string): ReadonlyPatient | undefined {
  if (!identifier) return undefined;
  const cleanTerm = identifier.trim().replace(/\D/g, '');

  return patientStore.find(p => p.id === identifier.trim() || p.cpf.replace(/\D/g, '') === cleanTerm);
}

/**
 * Retorna a lista completa de todos os pacientes cadastrados
 */
export function getAllPatients(): ReadonlyPatient[] {
  return patientStore.map(p => ({ ...p }));
}

/**
 * Marca um paciente como atendido no repositório em memória
 */
export function markPatientAsServed(id: string): Patient | undefined {
  const patient = patientStore.find(p => p.id === id);
  if (patient) {
    patient.atendido = true;
    patient.dataAtendimento = new Date();
    return { ...patient };
  }
  return undefined;
}

/**
 * Limpa o armazenamento em memória (utilizado em testes)
 */
export function clearPatientStore(): void {
  patientStore.length = 0;
  sequenceId = 1;
}

/**
 * Substitui o armazenamento em memória por uma lista de pacientes (utilizado na carga assíncrona R06)
 */
export function setPatientStore(patients: Patient[]): void {
  patientStore.length = 0;
  patientStore.push(...patients.map(p => ({
    ...p,
    dataDeChegada: new Date(p.dataDeChegada),
    dataAtendimento: p.dataAtendimento ? new Date(p.dataAtendimento) : undefined
  })));
  sequenceId = patientStore.length + 1;
}
