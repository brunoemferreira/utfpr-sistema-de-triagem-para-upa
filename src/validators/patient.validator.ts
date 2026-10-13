import { PatientRegistrationDTO } from '../domain/types/utility-types.js';

/**
 * RA01 — Validação de dados de entrada com Expressões Regulares (Regex)
 */

// Regex para validação de CPF (suporta formato pontuado '000.000.000-00' ou apenas 11 dígitos '00000000000')
const CPF_REGEX = /^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})$/;

// Regex para validação de Telefone (suporta DDD com/sem parênteses, celular com 9 dígitos ou fixo com 8 dígitos)
const TELEFONE_REGEX = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

// Regex para validação de E-mail (padrão de endereço eletrônico válido)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Regex para validação de Nome completo (pelo menos nome e sobrenome, aceita acentuação)
const NOME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ']{2,}(\s+[A-Za-zÀ-ÖØ-öø-ÿ']{2,})+$/;

/**
 * Valida o formato do CPF utilizando Regex e algoritmo dos dígitos verificadores
 */
export function validateCpf(cpf: string): boolean {
  if (!cpf || typeof cpf !== 'string') return false;

  const cleanedCpf = cpf.trim();
  if (!CPF_REGEX.test(cleanedCpf)) return false;

  // Remove caracteres não numéricos para validação matemática dos dígitos
  const digitsOnly = cleanedCpf.replace(/\D/g, '');
  if (digitsOnly.length !== 11) return false;

  // Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digitsOnly)) return false;

  // Algoritmo de validação do 1º e 2º dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digitsOnly.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(digitsOnly.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digitsOnly.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(digitsOnly.charAt(10))) return false;

  return true;
}

/**
 * Valida o formato do Telefone utilizando Regex
 */
export function validateTelefone(telefone: string): boolean {
  if (!telefone || typeof telefone !== 'string') return false;
  return TELEFONE_REGEX.test(telefone.trim());
}

/**
 * Valida o formato do E-mail utilizando Regex
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Valida o formato do Nome (Nome + Sobrenome) utilizando Regex
 */
export function validateNome(nome: string): boolean {
  if (!nome || typeof nome !== 'string') return false;
  return NOME_REGEX.test(nome.trim());
}

/**
 * Valida a idade do paciente
 */
export function validateIdade(idade: number): boolean {
  return typeof idade === 'number' && Number.isInteger(idade) && idade >= 0 && idade <= 130;
}

/**
 * Valida todos os campos de um formulário de cadastro de paciente
 */
export function validatePatientRegistration(data: Partial<PatientRegistrationDTO>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.nome || !validateNome(data.nome)) {
    errors.push('Nome inválido. Informe o nome e sobrenome completo.');
  }

  if (data.idade === undefined || !validateIdade(data.idade)) {
    errors.push('Idade inválida. Informe um número inteiro entre 0 e 130 anos.');
  }

  if (!data.cpf || !validateCpf(data.cpf)) {
    errors.push('CPF inválido. Informe no formato 000.000.000-00 ou 11 dígitos numéricos válidos.');
  }

  if (!data.telefone || !validateTelefone(data.telefone)) {
    errors.push('Telefone inválido. Informe no formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.');
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push('E-mail inválido. Informe um endereço de e-mail válido (exemplo@dominio.com).');
  }

  if (!data.sintomas || data.sintomas.trim().length < 3) {
    errors.push('Sintomas inválidos. Descreva os sintomas do paciente (mínimo 3 caracteres).');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
