import readline from 'readline';
import { PriorityLevel, PRIORITY_EMOJI } from '../domain/enums/priority-level.enum.js';
import { PatientRegistrationDTO, PatientUpdateDTO } from '../domain/types/utility-types.js';
import { registerPatient, updatePatient, findPatientByIdOrCpf, getAllPatients } from '../services/patient.service.js';
import { getTriageQueue, attendNextPatient } from '../services/queue.service.js';
import { searchPatients, listPatientsByPriority, calculateTriageStatistics } from '../services/stats.service.js';
import { classifyPatientRisk, getPriorityDescription } from '../services/classification.service.js';
import { loadAndSyncExternalData, syncPatientsToExternalApi } from '../infrastructure/api-simulator.service.js';

/**
 * Regra 04 — Menu Interativo via Terminal para acesso a todas as funcionalidades do sistema
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Pergunta assíncrona envelopada em Promise
 */
function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Limpa a tela do terminal
 */
function clearConsole(): void {
  console.clear();
}

/**
 * Exibe o cabeçalho do sistema
 */
function printHeader(): void {
  console.log('===========================================================');
  console.log('      SISTEMA DE TRIAGEM E GERENCIAMENTO DA UPA');
  console.log('===========================================================');
}

/**
 * Ponto de entrada do menu interativo no terminal
 */
export async function startInteractiveMenu(): Promise<void> {
  let running = true;

  // Carrega inicialmente os dados da API simulada
  console.log('Inicializando sistema e carregando dados externos...');
  await loadAndSyncExternalData(200);

  while (running) {
    printHeader();
    console.log('\n[ MENU PRINCIPAL ]\n');
    console.log(' 1. Cadastrar Novo Paciente');
    console.log(' 2. Classificar Risco & Reavaliar Paciente');
    console.log(' 3. Atender Próximo Paciente (Maior Prioridade)');
    console.log(' 4. Consultar Fila de Atendimento Ordenada');
    console.log(' 5. Buscar / Pesquisar Pacientes');
    console.log(' 6. Atualizar Cadastro de Paciente');
    console.log(' 7. Exibir Estatísticas do Atendimento');
    console.log(' 8. Recarregar Dados da API Externa');
    console.log(' 9. Salvar Estado Atual no JSON da API');
    console.log(' 0. Sair do Sistema');
    console.log('\n===========================================================');

    const option = await askQuestion('Escolha uma opção (0-9): ');

    switch (option.trim()) {
      case '1':
        await handleRegisterPatient();
        break;
      case '2':
        await handleReclassifyPatient();
        break;
      case '3':
        await handleAttendNext();
        break;
      case '4':
        await handleShowQueue();
        break;
      case '5':
        await handleSearchPatients();
        break;
      case '6':
        await handleUpdatePatient();
        break;
      case '7':
        await handleShowStatistics();
        break;
      case '8':
        await handleLoadExternalData();
        break;
      case '9':
        await handleSaveExternalData();
        break;
      case '0':
        console.log('\nEncerrando o Sistema de Triagem da UPA. Até logo!\n');
        running = false;
        rl.close();
        break;
      default:
        console.log('\nOpção inválida! Pressione Enter para tentar novamente.');
        await askQuestion('');
        break;
    }
  }
}

/**
 * 1. Cadastrar Novo Paciente
 */
async function handleRegisterPatient(): Promise<void> {
  console.log('\n--- CADASTRO DE NOVO PACIENTE ---');

  const nome = await askQuestion('Nome Completo: ');
  const idadeStr = await askQuestion('Idade: ');
  const cpf = await askQuestion('CPF (000.000.000-00 ou 11 dígitos): ');
  const telefone = await askQuestion('Telefone ((XX) XXXXX-XXXX): ');
  const email = await askQuestion('E-mail (usuario@dominio.com): ');
  const sintomas = await askQuestion('Sintomas informados / Queixa principal: ');

  const dto: PatientRegistrationDTO = {
    nome,
    idade: parseInt(idadeStr, 10),
    cpf,
    telefone,
    email,
    sintomas
  };

  const result = registerPatient(dto);

  if (result.success && result.patient) {
    console.log('\n[SUCESSO] Paciente cadastrado e classificado com sucesso!');
    console.log(`   ID: ${result.patient.id}`);
    console.log(`   Nome: ${result.patient.nome}`);
    console.log(`   Prioridade Atribuída: ${getPriorityDescription(result.patient.prioridade)}`);
  } else {
    console.log('\n[ERRO] Falha no cadastro! Erros encontrados:');
    result.errors?.forEach(err => console.log(`   - ${err}`));
  }

  await askQuestion('\nPressione Enter para voltar ao menu principal...');
}

/**
 * 2. Classificar Risco & Reavaliar
 */
async function handleReclassifyPatient(): Promise<void> {
  console.log('\n--- CLASSIFICAÇÃO DE RISCO & REAVALIAÇÃO ---');

  const term = await askQuestion('Informe o ID ou CPF do paciente: ');
  const patient = findPatientByIdOrCpf(term);

  if (!patient) {
    console.log('\n[ERRO] Paciente não encontrado.');
    await askQuestion('\nPressione Enter para continuar...');
    return;
  }

  const currentPriorityLabel = PRIORITY_EMOJI[patient.prioridade] || patient.prioridade;
  console.log(`\nPaciente encontrado: ${patient.nome} (Prioridade Atual: ${currentPriorityLabel})`);
  const novosSintomas = await askQuestion('Novos sintomas (deixe em branco para manter): ');

  console.log('\nSelecione uma prioridade explícita ou pressione Enter para classificação automática:');
  console.log(' 1. 🔴 VERMELHO (Emergência)');
  console.log(' 2. 🟠 LARANJA (Muito Urgente)');
  console.log(' 3. 🟡 AMARELO (Urgente)');
  console.log(' 4. 🟢 VERDE (Pouco Urgente)');
  console.log(' 5. 🔵 AZUL (Não Urgente)');
  const corChoice = await askQuestion('Opção (1-5 ou Enter para automático): ');

  let explicitPriority: PriorityLevel | undefined;
  if (corChoice.trim() === '1') explicitPriority = PriorityLevel.EMERGENCY;
  if (corChoice.trim() === '2') explicitPriority = PriorityLevel.VERY_URGENT;
  if (corChoice.trim() === '3') explicitPriority = PriorityLevel.URGENT;
  if (corChoice.trim() === '4') explicitPriority = PriorityLevel.STANDARD;
  if (corChoice.trim() === '5') explicitPriority = PriorityLevel.NON_URGENT;

  const updates: PatientUpdateDTO = {};
  if (novosSintomas.trim().length > 0) updates.sintomas = novosSintomas.trim();
  if (explicitPriority) updates.prioridade = explicitPriority;

  const result = updatePatient(patient.id, updates);

  if (result.success && result.patient) {
    console.log('\n[SUCESSO] Paciente reavaliado com sucesso!');
    console.log(`   Nova Prioridade: ${getPriorityDescription(result.patient.prioridade)}`);
  } else {
    console.log('\n[ERRO] Falha ao atualizar:');
    result.errors?.forEach(err => console.log(`   - ${err}`));
  }

  await askQuestion('\nPressione Enter para continuar...');
}

/**
 * 3. Atender Próximo Paciente
 */
async function handleAttendNext(): Promise<void> {
  console.log('\n--- CHAMADA DE ATENDIMENTO ---');

  const result = attendNextPatient();

  if (result.success && result.patient) {
    console.log('\n[CHAMADA DE PACIENTE]');
    console.log(`   ${result.message}`);
    console.log(`   ID: ${result.patient.id}`);
    console.log(`   CPF: ${result.patient.cpf}`);
    console.log(`   Sintomas: ${result.patient.sintomas}`);
    console.log(`   Data de Chegada: ${result.patient.dataDeChegada.toLocaleString()}`);
  } else {
    console.log(`\n[INFO] ${result.message}`);
  }

  await askQuestion('\nPressione Enter para continuar...');
}

/**
 * 4. Consultar Fila de Atendimento
 */
async function handleShowQueue(): Promise<void> {
  console.log('\n--- FILA DE TRIAGEM DE ATENDIMENTO ORDENADA ---');

  const queue = getTriageQueue();

  if (queue.length === 0) {
    console.log('\nFila vazia! Nenhum paciente aguardando no momento.');
  } else {
    console.log(`\nTotal aguardando atendimento: ${queue.length} paciente(s)\n`);
    queue.forEach((patient, index) => {
      const priorityLabel = PRIORITY_EMOJI[patient.prioridade] || patient.prioridade;
      console.log(` #${index + 1} | [${priorityLabel}] ${patient.nome} (${patient.idade} anos)`);
      console.log(`      ID: ${patient.id} | CPF: ${patient.cpf}`);
      console.log(`      Sintomas: ${patient.sintomas}`);
      console.log(`      Chegada: ${new Date(patient.dataDeChegada).toLocaleTimeString()}\n`);
    });
  }

  await askQuestion('Pressione Enter para continuar...');
}

/**
 * 5. Buscar / Pesquisar Pacientes
 */
async function handleSearchPatients(): Promise<void> {
  console.log('\n--- BUSCA DE PACIENTES ---');
  console.log('1. Pesquisar por Nome, CPF ou Sintomas');
  console.log('2. Filtrar por Nível de Prioridade (Cor)');
  const opt = await askQuestion('Opção (1-2): ');

  if (opt.trim() === '1') {
    const query = await askQuestion('Digite o termo de busca: ');
    const results = searchPatients(query);

    console.log(`\nResultados encontrados: ${results.length}\n`);
    results.forEach(p => {
      const priorityLabel = PRIORITY_EMOJI[p.prioridade] || p.prioridade;
      console.log(` • [${p.id}] ${p.nome} - Prioridade: ${priorityLabel} | Status: ${p.atendido ? 'ATENDIDO' : 'AGUARDANDO'}`);
    });
  } else if (opt.trim() === '2') {
    console.log('Cores: 1. 🔴 VERMELHO | 2. 🟠 LARANJA | 3. 🟡 AMARELO | 4. 🟢 VERDE | 5. 🔵 AZUL');
    const colorOpt = await askQuestion('Escolha a cor (1-5): ');
    let selectedPriority: PriorityLevel = PriorityLevel.STANDARD;

    if (colorOpt.trim() === '1') selectedPriority = PriorityLevel.EMERGENCY;
    if (colorOpt.trim() === '2') selectedPriority = PriorityLevel.VERY_URGENT;
    if (colorOpt.trim() === '3') selectedPriority = PriorityLevel.URGENT;
    if (colorOpt.trim() === '4') selectedPriority = PriorityLevel.STANDARD;
    if (colorOpt.trim() === '5') selectedPriority = PriorityLevel.NON_URGENT;

    const results = listPatientsByPriority(selectedPriority);
    const selectedLabel = PRIORITY_EMOJI[selectedPriority] || selectedPriority;
    console.log(`\nPacientes na cor ${selectedLabel}: ${results.length}\n`);
    results.forEach(p => {
      console.log(` • [${p.id}] ${p.nome} (${p.idade} anos) - Status: ${p.atendido ? 'ATENDIDO' : 'AGUARDANDO'}`);
    });
  }

  await askQuestion('\nPressione Enter para continuar...');
}

/**
 * 6. Atualizar Cadastro de Paciente
 */
async function handleUpdatePatient(): Promise<void> {
  console.log('\n--- ATUALIZAR CADASTRO DE PACIENTE ---');

  const term = await askQuestion('Informe o ID ou CPF do paciente: ');
  const patient = findPatientByIdOrCpf(term);

  if (!patient) {
    console.log('\n[ERRO] Paciente não encontrado.');
    await askQuestion('\nPressione Enter para continuar...');
    return;
  }

  console.log(`\nAtualizando paciente: ${patient.nome}`);
  const novoTelefone = await askQuestion(`Novo Telefone (Atual: ${patient.telefone}) [Enter para manter]: `);
  const novoEmail = await askQuestion(`Novo E-mail (Atual: ${patient.email}) [Enter para manter]: `);

  const updates: PatientUpdateDTO = {};
  if (novoTelefone.trim()) updates.telefone = novoTelefone.trim();
  if (novoEmail.trim()) updates.email = novoEmail.trim();

  const result = updatePatient(patient.id, updates);

  if (result.success) {
    console.log('\n[SUCESSO] Cadastro atualizado com sucesso!');
  } else {
    console.log('\n[ERRO] Erro ao atualizar:');
    result.errors?.forEach(err => console.log(`   - ${err}`));
  }

  await askQuestion('\nPressione Enter para continuar...');
}

/**
 * 7. Exibir Estatísticas do Atendimento
 */
async function handleShowStatistics(): Promise<void> {
  console.log('\n--- ESTATÍSTICAS E RELATÓRIO DA UPA ---');

  const stats = calculateTriageStatistics();

  console.log(`\n Total de Pacientes Registrados : ${stats.totalPacientes}`);
  console.log(` Pacientes Atendidos          : ${stats.totalAtendidos}`);
  console.log(` Pacientes Aguardando         : ${stats.totalAguardando}`);
  console.log(` Idade Média dos Pacientes    : ${stats.idadeMedia} anos`);
  console.log('\n Contagem por Cor de Prioridade:');
  console.log(`   ${stats.resumoPrioridadesFormatado}`);

  await askQuestion('\nPressione Enter para continuar...');
}

/**
 * 8. Carregar Dados da API Externa
 */
async function handleLoadExternalData(): Promise<void> {
  console.log('\n--- SIMULAÇÃO DE API EXTERNA (CARGA ASSÍNCRONA) ---');
  console.log('Efetuando requisição assíncrona HTTP simulada com Promises...');

  const result = await loadAndSyncExternalData(500);

  if (result.success) {
    console.log(`\n[SUCESSO] ${result.count} paciente(s) carregados da API externa.`);
  } else {
    console.log('\n[ERRO] Falha ao carregar dados da API externa.');
  }

  await askQuestion('\nPressione Enter para continuar...');
}

/**
 * 9. Salvar Estado na API Externa
 */
async function handleSaveExternalData(): Promise<void> {
  console.log('\n--- SALVAR ESTADO NA API EXTERNA (PERSISTÊNCIA JSON) ---');
  console.log('Enviando dados assincronamente...');

  const result = await syncPatientsToExternalApi(500);

  if (result.success) {
    console.log(`\n[SUCESSO] Estado salvo com sucesso! ${result.count} registro(s) sincronizados em JSON.`);
  } else {
    console.log('\n[ERRO] Falha ao salvar estado na API.');
  }

  await askQuestion('\nPressione Enter para continuar...');
}
