import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateCpf,
  validateTelefone,
  validateEmail,
  validateNome,
  validateIdade,
  validatePatientRegistration
} from '../src/validators/patient.validator.js';

describe('RA01 - Validação com Expressões Regulares (Regex)', () => {
  it('deve validar CPFs válidos com e sem pontuação', () => {
    // CPFs válidos com checksum correto
    assert.strictEqual(validateCpf('52998224725'), true);
    assert.strictEqual(validateCpf('529.982.247-25'), true);
  });

  it('deve rejeitar CPFs inválidos ou mal formatados', () => {
    assert.strictEqual(validateCpf('111.111.111-11'), false); // Digitos repetidos
    assert.strictEqual(validateCpf('12345'), false);         // Curto
    assert.strictEqual(validateCpf('abc.def.ghi-jk'), false); // Letras
    assert.strictEqual(validateCpf(''), false);
  });

  it('deve validar telefones válidos com diferentes formatos', () => {
    assert.strictEqual(validateTelefone('(41) 99999-8888'), true);
    assert.strictEqual(validateTelefone('41 99999-8888'), true);
    assert.strictEqual(validateTelefone('4133334444'), true);
  });

  it('deve rejeitar telefones inválidos', () => {
    assert.strictEqual(validateTelefone('1234'), false);
    assert.strictEqual(validateTelefone('telefone-invalido'), false);
  });

  it('deve validar e-mails válidos', () => {
    assert.strictEqual(validateEmail('paciente@email.com'), true);
    assert.strictEqual(validateEmail('maria.silva@upa.gov.br'), true);
  });

  it('deve rejeitar e-mails inválidos', () => {
    assert.strictEqual(validateEmail('email-sem-arroba.com'), false);
    assert.strictEqual(validateEmail('@sem-usuario.com'), false);
    assert.strictEqual(validateEmail(''), false);
  });

  it('deve validar nome e sobrenome completo', () => {
    assert.strictEqual(validateNome('Maria da Silva'), true);
    assert.strictEqual(validateNome('João Carlos'), true);
    assert.strictEqual(validateNome('João'), false); // Apenas 1 nome
    assert.strictEqual(validateNome('123 Silva'), false);
  });

  it('deve validar idade dentro dos limites', () => {
    assert.strictEqual(validateIdade(0), true);
    assert.strictEqual(validateIdade(45), true);
    assert.strictEqual(validateIdade(130), true);
    assert.strictEqual(validateIdade(-5), false);
    assert.strictEqual(validateIdade(150), false);
  });

  it('deve retornar conjunto de erros para formulário de cadastro inválido', () => {
    const invalidForm = {
      nome: 'Maria',
      idade: -10,
      cpf: '000',
      telefone: '123',
      email: 'invalido',
      sintomas: 'x'
    };

    const result = validatePatientRegistration(invalidForm);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.errors.length > 0, true);
  });
});
