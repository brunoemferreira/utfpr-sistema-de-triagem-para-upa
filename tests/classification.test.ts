import { describe, it } from 'node:test';
import assert from 'node:assert';
import { classifyPatientRisk, getPriorityDescription } from '../src/services/classification.service.js';
import { PriorityLevel } from '../src/domain/enums/priority-level.enum.js';

describe('R03 & RA03 - Classificação de Risco com ts-pattern', () => {
  it('deve classificar sintomas de parada cardiorrespiratória como VERMELHO (Emergência)', () => {
    const priority = classifyPatientRisk('Paciente em parada cardiorrespiratoria e inconsciente');
    assert.strictEqual(priority, PriorityLevel.EMERGENCY);
  });

  it('deve classificar dor no peito como LARANJA (Muito Urgente)', () => {
    const priority = classifyPatientRisk('Forte dor no peito com falta de ar severa');
    assert.strictEqual(priority, PriorityLevel.VERY_URGENT);
  });

  it('deve classificar febre alta como AMARELO (Urgente)', () => {
    const priority = classifyPatientRisk('Paciente com febre alta e vomito persistente');
    assert.strictEqual(priority, PriorityLevel.URGENT);
  });

  it('deve classificar sintomas leves como VERDE (Pouco Urgente)', () => {
    const priority = classifyPatientRisk('Paciente com dor de cabeca e resfriado leve');
    assert.strictEqual(priority, PriorityLevel.STANDARD);
  });

  it('deve classificar procedimentos de rotina como AZUL (Não Urgente)', () => {
    const priority = classifyPatientRisk('Solicitação de renovacao de receita e atestado');
    assert.strictEqual(priority, PriorityLevel.NON_URGENT);
  });

  it('deve respeitar a prioridade explícita informada manualmente', () => {
    const priority = classifyPatientRisk('dor de cabeca', PriorityLevel.EMERGENCY);
    assert.strictEqual(priority, PriorityLevel.EMERGENCY);
  });

  it('deve fornecer descrição exaustiva de todas as cores do Protocolo de Manchester', () => {
    assert.match(getPriorityDescription(PriorityLevel.EMERGENCY), /VERMELHO/);
    assert.match(getPriorityDescription(PriorityLevel.VERY_URGENT), /LARANJA/);
    assert.match(getPriorityDescription(PriorityLevel.URGENT), /AMARELO/);
    assert.match(getPriorityDescription(PriorityLevel.STANDARD), /VERDE/);
    assert.match(getPriorityDescription(PriorityLevel.NON_URGENT), /AZUL/);
  });
});
