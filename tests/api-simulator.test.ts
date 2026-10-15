import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fetchExternalPatients, loadAndSyncExternalData } from '../src/infrastructure/api-simulator.service.js';
import { getAllPatients } from '../src/services/patient.service.js';

describe('R06 - Simulação de Comunicação Assíncrona com API Externa (Promises e JSON)', () => {
  it('deve carregar dados assincronamente da API externa simulada', async () => {
    const patients = await fetchExternalPatients(50); // Latência reduzida para os testes

    assert.ok(Array.isArray(patients));
    assert.strictEqual(patients.length >= 3, true);
    assert.ok(patients[0].dataDeChegada instanceof Date);
    assert.strictEqual(patients[0].nome, 'Sebastião Ferreira');
  });

  it('deve sincronizar dados da API externa com o estado interno do sistema', async () => {
    const syncResult = await loadAndSyncExternalData(50);

    assert.strictEqual(syncResult.success, true);
    assert.strictEqual(syncResult.count >= 3, true);

    const currentPatients = getAllPatients();
    assert.strictEqual(currentPatients.length, syncResult.count);
    assert.strictEqual(currentPatients[0].id, 'PAC-0001');
  });
});
