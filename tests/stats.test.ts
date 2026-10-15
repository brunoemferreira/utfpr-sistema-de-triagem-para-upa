import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { listPatientsByPriority, searchPatients, calculateTriageStatistics } from '../src/services/stats.service.js';
import { registerPatient, clearPatientStore } from '../src/services/patient.service.js';
import { attendNextPatient } from '../src/services/queue.service.js';
import { PriorityLevel } from '../src/domain/enums/priority-level.enum.js';

const CPF_1 = '52998224725';
const CPF_2 = '11144477735';

describe('R04 - Consulta, Busca e Geração de Estatísticas', () => {
  beforeEach(() => {
    clearPatientStore();

    registerPatient({
      nome: 'Maria da Silva',
      idade: 60,
      cpf: CPF_1,
      telefone: '(41) 99999-1111',
      email: 'maria@email.com',
      sintomas: 'Forte dor no peito'
    }, PriorityLevel.VERY_URGENT);

    registerPatient({
      nome: 'João Santos',
      idade: 20,
      cpf: CPF_2,
      telefone: '(41) 98888-2222',
      email: 'joao@email.com',
      sintomas: 'Resfriado e tosse leve'
    }, PriorityLevel.STANDARD);
  });

  it('deve listar pacientes por prioridade específica (filter)', () => {
    const muitoUrgentes = listPatientsByPriority(PriorityLevel.VERY_URGENT);
    const poucoUrgentes = listPatientsByPriority(PriorityLevel.STANDARD);

    assert.strictEqual(muitoUrgentes.length, 1);
    assert.strictEqual(muitoUrgentes[0].nome, 'Maria da Silva');

    assert.strictEqual(poucoUrgentes.length, 1);
    assert.strictEqual(poucoUrgentes[0].nome, 'João Santos');
  });

  it('deve buscar pacientes por termo no nome ou CPF (some, filter)', () => {
    const searchByName = searchPatients('Maria');
    const searchByCpf = searchPatients('111.444.777-35');
    const searchBySymptom = searchPatients('tosse');

    assert.strictEqual(searchByName.length, 1);
    assert.strictEqual(searchByName[0].nome, 'Maria da Silva');

    assert.strictEqual(searchByCpf.length, 1);
    assert.strictEqual(searchByCpf[0].nome, 'João Santos');

    assert.strictEqual(searchBySymptom.length, 1);
    assert.strictEqual(searchBySymptom[0].nome, 'João Santos');
  });

  it('deve calcular estatísticas consolidadas da UPA (reduce, map, join)', () => {
    // Atende o paciente de maior prioridade (Maria)
    attendNextPatient();

    const stats = calculateTriageStatistics();

    assert.strictEqual(stats.totalPacientes, 2);
    assert.strictEqual(stats.totalAtendidos, 1);
    assert.strictEqual(stats.totalAguardando, 1);
    assert.strictEqual(stats.idadeMedia, 40); // (60 + 20) / 2 = 40.0
    assert.strictEqual(stats.contagemPorPrioridade[PriorityLevel.VERY_URGENT], 1);
    assert.strictEqual(stats.contagemPorPrioridade[PriorityLevel.STANDARD], 1);
    assert.match(stats.resumoPrioridadesFormatado, /LARANJA: 1/);
    assert.match(stats.resumoPrioridadesFormatado, /VERDE: 1/);
  });
});
