import { startInteractiveMenu } from './cli/menu.js';

/**
 * Ponto de Entrada Principal do Sistema de Triagem para UPA
 */
async function main(): Promise<void> {
  try {
    await startInteractiveMenu();
  } catch (error) {
    console.error('Erro crítico na execução da aplicação:', error);
    process.exit(1);
  }
}

main();
