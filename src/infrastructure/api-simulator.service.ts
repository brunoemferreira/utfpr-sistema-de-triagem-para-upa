import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { Patient } from '../domain/entities/patient.entity.js';
import { setPatientStore, getAllPatients } from '../services/patient.service.js';

/**
 * R06 — Simulação de Comunicação Assíncrona com API Externa
 *
 * Utiliza Promises, manipulação de arquivos JSON e simulação de latência de rede.
 */

const DATA_FILE_PATH = join(process.cwd(), 'data', 'initial_patients.json');

/**
 * Helper para simular latência de rede (retardo assíncrono)
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Carrega a lista de pacientes de uma fonte externa simulada (arquivo JSON)
 */
export async function fetchExternalPatients(simulateLatencyMs = 300): Promise<Patient[]> {
  // Simula o tempo de tráfego de rede HTTP
  await delay(simulateLatencyMs);

  try {
    const rawData = await readFile(DATA_FILE_PATH, 'utf-8');
    const parsedData: Patient[] = JSON.parse(rawData);

    // Converte datas em formato ISO String para objetos Date nativos
    const patients = parsedData.map(p => ({
      ...p,
      dataDeChegada: new Date(p.dataDeChegada),
      dataAtendimento: p.dataAtendimento ? new Date(p.dataAtendimento) : undefined
    }));

    return patients;
  } catch (error) {
    console.error('Erro ao ler dados da API externa simulada:', error);
    return [];
  }
}

/**
 * Importa dados da API externa simulada para o repositório em memória do sistema
 */
export async function loadAndSyncExternalData(simulateLatencyMs = 300): Promise<{ success: boolean; count: number }> {
  const externalPatients = await fetchExternalPatients(simulateLatencyMs);
  if (externalPatients.length > 0) {
    setPatientStore(externalPatients);
    return { success: true, count: externalPatients.length };
  }
  return { success: false, count: 0 };
}

/**
 * Salva a lista de pacientes atual do sistema na API externa simulada (persistência em JSON)
 */
export async function syncPatientsToExternalApi(simulateLatencyMs = 300): Promise<{ success: boolean; count: number }> {
  await delay(simulateLatencyMs);

  try {
    const currentPatients = getAllPatients();
    const jsonContent = JSON.stringify(currentPatients, null, 2);
    await writeFile(DATA_FILE_PATH, jsonContent, 'utf-8');
    return { success: true, count: currentPatients.length };
  } catch (error) {
    console.error('Erro ao salvar dados na API externa simulada:', error);
    return { success: false, count: 0 };
  }
}
