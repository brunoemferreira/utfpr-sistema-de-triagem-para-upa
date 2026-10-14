import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  registerPatient,
  updatePatient,
  findPatientByIdOrCpf,
  getAllPatients,
  clearPatientStore
} from '../src/services/patient.service.js';
import { PriorityLevel } from '../src/domain/enums/priority-level.enum.js';

describe('R01 & R02 - Cadastro e Gerenciamento de Pacientes', () => {
  beforeEach(() => {
    clearPatientStore();
  });

  it('deve cadastrar um novo paciente com sucesso e atribuir prioridade automática', () => {
    const result = registerPatient({
      nome: 'Carlos Eduardo',
      idade: 38,
      cpf: '52998224725',
      telefone: '(41) 98888-7777',
      email: 'carlos@email.com',
      sintomas: 'Forte dor no peito e falta de ar severa'
    });

    assert.strictEqual(result.success, true);
    assert.ok(result.patient);
    assert.strictEqual(result.patient?.nome, 'Carlos Eduardo');
    assert.strictEqual(result.patient?.prioridade, PriorityLevel.VERY_URGENT);
    assert.strictEqual(result.patient?.atendido, false);
  });

  it('deve rejeitar cadastro com dados inválidos (Regex)', () => {
    const result = registerPatient({
      nome: 'Carlos',
      idade: -5,
      cpf: '123',
      telefone: 'abc',
      email: 'email-invalido',
      sintomas: ''
    });

    assert.strictEqual(result.success, false);
    assert.ok(result.errors && result.errors.length > 0);
  });

  it('deve rejeitar cadastro de CPF duplicado', () => {
    registerPatient({
      nome: 'Carlos Eduardo',
      idade: 38,
      cpf: '52998224725',
      telefone: '(41) 98888-7777',
      email: 'carlos@email.com',
      sintomas: 'Dor de cabeça'
    });

    const duplicate = registerPatient({
      nome: 'Outro Paciente',
      idade: 25,
      cpf: '529.982.247-25',
      telefone: '(41) 99999-1111',
      email: 'outro@email.com',
      sintomas: 'Tosse'
    });

    assert.strictEqual(duplicate.success, false);
    assert.match(duplicate.errors![0], /já cadastrado/);
  });

  it('deve atualizar informações de um paciente cadastrado (RA02 Partial)', () => {
    const created = registerPatient({
      nome: 'Ana Paula',
      idade: 29,
      cpf: '52998224725',
      telefone: '(41) 97777-6666',
      email: 'ana@email.com',
      sintomas: 'Febre baixa'
    });

    const updateResult = updatePatient(created.patient!.id, {
      telefone: '(41) 91111-2222',
      sintomas: 'Parada cardiorrespiratoria e falta de pulso'
    });

    assert.strictEqual(updateResult.success, true);
    assert.strictEqual(updateResult.patient?.telefone, '(41) 91111-2222');
    assert.strictEqual(updateResult.patient?.prioridade, PriorityLevel.EMERGENCY);
  });

  it('deve localizar paciente por ID ou por CPF', () => {
    const created = registerPatient({
      nome: 'Roberto Souza',
      idade: 60,
      cpf: '52998224725',
      telefone: '(41) 93333-2222',
      email: 'roberto@email.com',
      sintomas: 'Hipertensao'
    });

    const byId = findPatientByIdOrCpf(created.patient!.id);
    const byCpf = findPatientByIdOrCpf('529.982.247-25');

    assert.ok(byId);
    assert.ok(byCpf);
    assert.strictEqual(byId?.nome, 'Roberto Souza');
    assert.strictEqual(byCpf?.id, created.patient!.id);
  });
});
