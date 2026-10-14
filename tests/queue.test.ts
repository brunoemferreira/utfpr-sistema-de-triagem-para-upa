import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { getTriageQueue, attendNextPatient, getPatientQueuePosition } from '../src/services/queue.service.js';
import { registerPatient, clearPatientStore } from '../src/services/patient.service.js';
import { PriorityLevel } from '../src/domain/enums/priority-level.enum.js';

// CPFs matematicamente válidos para uso nos testes
const CPF_1 = '52998224725';
const CPF_2 = '11144477735';
const CPF_3 = '529.982.247-25'; // Teste com formatação

describe('R03 - Gerenciamento da Fila por Prioridade e Ordem de Chegada', () => {
  beforeEach(() => {
    clearPatientStore();
  });

  it('deve ordenar pacientes prioritariamente por cor do Protocolo de Manchester', () => {
    const regVerde = registerPatient({
      nome: 'Paciente Verde',
      idade: 30,
      cpf: CPF_1,
      telefone: '(41) 99999-1111',
      email: 'verde@email.com',
      sintomas: 'Tosse leve'
    }, PriorityLevel.STANDARD);
    assert.strictEqual(regVerde.success, true, JSON.stringify(regVerde.errors));

    const regVermelho = registerPatient({
      nome: 'Paciente Vermelho',
      idade: 50,
      cpf: CPF_2,
      telefone: '(41) 99999-2222',
      email: 'vermelho@email.com',
      sintomas: 'Parada cardiorrespiratoria'
    }, PriorityLevel.EMERGENCY);
    assert.strictEqual(regVermelho.success, true, JSON.stringify(regVermelho.errors));

    const pStandard = regVerde.patient!;
    const pEmergency = regVermelho.patient!;

    const queue = getTriageQueue();
    assert.strictEqual(queue.length, 2);
    assert.strictEqual(queue[0].id, pEmergency.id); // Vermelho em 1º lugar
    assert.strictEqual(queue[1].id, pStandard.id);  // Verde em 2º lugar
  });

  it('deve usar tempo de chegada (FIFO) como critério de desempate para mesma prioridade', () => {
    const reg1 = registerPatient({
      nome: 'Primeiro Amarelo',
      idade: 30,
      cpf: CPF_1,
      telefone: '(41) 99999-1111',
      email: 'p1@email.com',
      sintomas: 'Febre alta'
    }, PriorityLevel.URGENT);
    assert.strictEqual(reg1.success, true);

    const reg2 = registerPatient({
      nome: 'Segundo Amarelo',
      idade: 35,
      cpf: CPF_2,
      telefone: '(41) 99999-2222',
      email: 'p2@email.com',
      sintomas: 'Febre alta'
    }, PriorityLevel.URGENT);
    assert.strictEqual(reg2.success, true);

    const queue = getTriageQueue();
    assert.strictEqual(queue[0].id, reg1.patient!.id);
    assert.strictEqual(queue[1].id, reg2.patient!.id);
  });

  it('deve chamar o próximo paciente com maior prioridade e alterar status para atendido', () => {
    registerPatient({
      nome: 'Paciente Verde',
      idade: 30,
      cpf: CPF_1,
      telefone: '(41) 99999-1111',
      email: 'verde@email.com',
      sintomas: 'Tosse leve'
    }, PriorityLevel.STANDARD);

    registerPatient({
      nome: 'Paciente Vermelho',
      idade: 50,
      cpf: CPF_2,
      telefone: '(41) 99999-2222',
      email: 'vermelho@email.com',
      sintomas: 'Parada cardiorrespiratoria'
    }, PriorityLevel.EMERGENCY);

    const callResult = attendNextPatient();
    assert.strictEqual(callResult.success, true);
    assert.strictEqual(callResult.patient?.nome, 'Paciente Vermelho');
    assert.strictEqual(callResult.patient?.atendido, true);

    const remainingQueue = getTriageQueue();
    assert.strictEqual(remainingQueue.length, 1);
    assert.strictEqual(remainingQueue[0].nome, 'Paciente Verde');
  });

  it('deve calcular corretamente a posição de um paciente na fila', () => {
    const p1 = registerPatient({
      nome: 'Paciente Laranja',
      idade: 60,
      cpf: CPF_1,
      telefone: '(41) 99999-1111',
      email: 'l1@email.com',
      sintomas: 'Dor no peito'
    }, PriorityLevel.VERY_URGENT).patient!;

    const p2 = registerPatient({
      nome: 'Paciente Azul',
      idade: 20,
      cpf: CPF_2,
      telefone: '(41) 99999-2222',
      email: 'a1@email.com',
      sintomas: 'Atestado'
    }, PriorityLevel.NON_URGENT).patient!;

    assert.strictEqual(getPatientQueuePosition(p1.id), 1);
    assert.strictEqual(getPatientQueuePosition(p2.id), 2);
  });
});
