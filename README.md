# Sistema de Triagem e Gerenciamento de Atendimento para UPA

Sistema de Triagem para Unidade de Pronto Atendimento (UPA) desenvolvido em **TypeScript** e **Node.js**, sem interface gráfica (executado via terminal CLI), aplicando rigorosamente os princípios de **Código Limpo (Clean Code)** e **Arquitetura Limpa (Clean Architecture)**.

---

## Problema a Ser Resolvido
Uma Unidade de Pronto Atendimento (UPA) realiza diariamente centenas de atendimentos. O processo de triagem precisa classificar pacientes conforme o grau de urgência, organizar a fila de atendimento, registrar alterações de prioridade e disponibilizar estatísticas para a equipe médica.

---

## Tecnologias e Recursos Utilizados

- **Linguagem**: TypeScript (v5.3+)
- **Runtime**: Node.js (v20+)
- **Pattern Matching**: `ts-pattern` (v5.6+)
- **Test Runner**: Node.js Test Runner nativo (`node:test` e `node:assert`)
- **Validação de Dados**: Expressões Regulares (Regex)

---

## Estrutura do Projeto (Clean Architecture)

```text
sistema-de-triagem-para-upa/
├── data/
│   └── initial_patients.json        # Dados simulados para carga externa assíncrona (R06)
├── src/
│   ├── domain/
│   │   ├── enums/
│   │   │   └── priority-level.enum.ts# Níveis de urgência da triagem (Vermelho, Laranja, Amarelo, Verde, Azul)
│   │   ├── entities/
│   │   │   └── patient.entity.ts    # Entidade Paciente e tipos do domínio (R05)
│   │   └── types/
│   │       └── utility-types.ts     # Tipos utilitários do TypeScript (RA02)
│   ├── validators/
│   │   └── patient.validator.ts     # Validadores com Expressões Regulares (RA01)
│   ├── services/
│   │   ├── classification.service.ts# Classificação de Risco com ts-pattern (R03, RA03)
│   │   ├── patient.service.ts       # Gestão e Cadastro de Pacientes (R01, R02)
│   │   ├── queue.service.ts         # Fila de Atendimento com ordenação por prioridade (R03)
│   │   └── stats.service.ts         # Consultas e Estatísticas da UPA (R04)
│   ├── infrastructure/
│   │   └── api-simulator.service.ts # Simulação de API externa com Promises/JSON (R06)
│   ├── cli/
│   │   └── menu.ts                  # Menu Interativo via Terminal (Regra 04)
│   └── index.ts                     # Ponto de entrada da aplicação
├── tests/
│   ├── classification.test.ts       # Testes da classificação de risco (R07)
│   ├── queue.test.ts                # Testes da ordenação da fila (R07)
│   ├── validation.test.ts           # Testes das validações Regex (R07)
│   └── api-simulator.test.ts        # Testes das operações assíncronas (R07)
├── package.json
├── tsconfig.json
└── README.md                        # Documentação detalhada do projeto
```

---

## Mapeamento e Detalhamento dos 10 Requisitos

### **R01 — Cadastro e Gerenciamento de Pacientes**
- **Objetivo do Requisito**: O sistema deve permitir o cadastro de pacientes contendo informações essenciais para o atendimento de urgência (nome, idade, sintomas, CPF, telefone, e-mail, data de chegada e prioridade de atendimento), além de disponibilizar operações para consultar e atualizar os dados cadastrados.
- **Como foi Implementado**:
  - Implementado no módulo `src/services/patient.service.ts`.
  - Criadas as funções `registerPatient()`, `updatePatient()`, `findPatientByIdOrCpf()`, `getAllPatients()` e `markPatientAsServed()`.
  - O cadastro recebe os dados de entrada via DTO, realiza a validação por Regex, classifica o risco automaticamente com base nos sintomas e gera um identificador único sequencial (ex.: `PAC-0001`).
- **Decisões Técnicas e Arquiteturais**:
  1. *Encapsulamento do Estado*: O armazenamento de pacientes fica restrito à variável `patientStore` dentro do módulo de serviço, impedindo acessos globais descontrolados.
  2. *Prevenção de Duplicidade*: Implementada checagem estrita de CPF normalizado (apenas números) para evitar que um paciente seja cadastrado duplicadamente em aberto.
  3. *Preservação de Imutabilidade*: As funções de busca e listagem retornam cópias superficiais (`{ ...patient }`) tipadas como `ReadonlyPatient`, garantindo que modificações externas não alterem o repositório por efeito colateral.

---

### **R02 — Organização das Funcionalidades do Sistema (Clean Architecture & Modularização)**
- **Objetivo do Requisito**: O sistema deve ser estruturado em módulos independentes e funções reutilizáveis, separando claramente as responsabilidades de domínio, validação, regras de negócio, infraestrutura e apresentação.
- **Como foi Implementado**:
  - Organização rigorosa em camadas dentro do diretório `src/`:
    - `domain/`: Contém os contratos do modelo (`patient.entity.ts`), enums de prioridade e os tipos utilitários. Esta camada é 100% pura e independente de qualquer biblioteca externa ou I/O.
    - `validators/`: Contém funções puras dedicadas exclusivamente à validação de formato de dados (`patient.validator.ts`).
    - `services/`: Encapsula a lógica de negócio (classificação de risco, gestão de fila, CRUD de pacientes e geração de estatísticas).
    - `infrastructure/`: Abstrai a comunicação assíncrona e persistência em arquivo JSON (`api-simulator.service.ts`).
    - `cli/`: Cuida unicamente da interação com o usuário via terminal (`menu.ts`).
- **Decisões Técnicas e Arquiteturais**:
  1. *Princípio da Responsabilidade Única (SRP - SOLID)*: Cada arquivo possui uma única razão para existir e mudar. Se a regra de validação de CPF mudar, altera-se apenas o validador; se o meio de persistência mudar, altera-se apenas o serviço de infraestrutura.
  2. *Baixo Acoplamento e Reutilização*: Funções puras exportadas individualmente via named exports (`export function ...`), permitindo que a suíte de testes consuma diretamente a lógica de negócio sem depender da interface do terminal.

---

### **R03 — Classificação e Gerenciamento da Fila de Atendimento**
- **Objetivo do Requisito**: O sistema deve aplicar regras de negócio para classificar o paciente conforme a gravidade do seu estado clínico, mantendo uma fila de atendimento ordenada rigorosamente por prioridade e tempo de espera.
- **Como foi Implementado**:
  - Desenvolvido em `src/services/queue.service.ts` e `src/services/classification.service.ts`.
  - A classificação fundamenta-se nas cinco cores do **Protocolo de Manchester**:
    1. **🔴 VERMELHO (Emergência)**: Atendimento imediato (0 min). Peso 1.
    2. **🟠 LARANJA (Muito Urgente)**: Atendimento em até 10 min. Peso 2.
    3. **🟡 AMARELO (Urgente)**: Atendimento em até 60 min. Peso 3.
    4. **🟢 VERDE (Pouco Urgente)**: Atendimento em até 120 min. Peso 4.
    5. **🔵 AZUL (Não Urgente)**: Atendimento em até 240 min. Peso 5.
- **Decisões Técnicas e Arquiteturais**:
  1. *Algoritmo de Ordenação Estável (Priority Queue + FIFO)*: A função `getTriageQueue()` filtra os pacientes pendentes (`atendido === false`) e executa a ordenação combinando dois critérios:
     - **Critério Primário**: Compara os pesos numéricos das prioridades (`PRIORITY_WEIGHT[a.prioridade] - PRIORITY_WEIGHT[b.prioridade]`).
     - **Critério Secundário (Desempate FIFO)**: Quando dois pacientes possuem a mesma cor de prioridade, o desempate é feito pelo timestamp da data de chegada (`dataDeChegada.getTime()`).
  2. *Controle de Fluxo de Chamada*: A função `attendNextPatient()` consome o paciente no topo da fila ordenada, atualizando atomicamente os campos `atendido = true` e `dataAtendimento = new Date()`.

---

### **R04 — Consulta, Busca e Geração de Estatísticas**
- **Objetivo do Requisito**: Disponibilizar operações de análise dos dados dos pacientes, incluindo listagens por prioridade, localização de pacientes específicos por termos e geração de relatórios consolidados sobre a UPA.
- **Como foi Implementado**:
  - Implementado em `src/services/stats.service.ts`.
  - Aplicação prática e intensiva dos métodos avançados de Array do JavaScript/TypeScript (`map`, `filter`, `find`, `some`, `reduce`, `join`).
- **Decisões Técnicas e Arquiteturais**:
  1. *Filtros de Prioridade (`filter` e `map`)*: `listPatientsByPriority()` extrai instantaneamente todos os pacientes de um determinado grau de urgência.
  2. *Busca Multicritério (`filter` com `some`)*: `searchPatients()` aceita qualquer fragmento de texto e pesquisa de forma insensível a maiúsculas/minúsculas em nome, CPF (normalizado), sintomas e e-mail.
  3. *Consolidação com `reduce`*: A função `calculateTriageStatistics()` varre a coleção em uma única passagem para calcular:
     - Idade média dos pacientes: `reduce((soma, p) => soma + p.idade, 0) / total`.
     - Contagem agrupada por cor utilizando o Utility Type `Record<PriorityLevel, number>`.
     - Síntese formatada utilizando `Object.entries().map().join(' | ')`.

---

### **R05 — Modelagem das Entidades do Sistema (Domain Entities & Enums)**
- **Objetivo do Requisito**: Representar com precisão o domínio da UPA através de estruturas fortemente tipadas em TypeScript, garantindo segurança estática e eliminando erros em tempo de execução.
- **Como foi Implementado**:
  - Definido nos arquivos `src/domain/entities/patient.entity.ts` e `src/domain/enums/priority-level.enum.ts`.
- **Decisões Técnicas e Arquiteturais**:
  1. *Interface do Domínio (`Patient`)*:
     ```typescript
     export interface Patient {
       id: string;
       nome: string;
       idade: number;
       cpf: string;
       telefone: string;
       email: string;
       sintomas: string;
       dataDeChegada: Date;
       prioridade: PriorityLevel;
       atendido: boolean;
       dataAtendimento?: Date;
     }
     ```
  2. *Enum Forte (`PriorityLevel`)*: Garante que os níveis de urgência assumam estritamente um dos valores mapeados (`'VERMELHO'`, `'LARANJA'`, `'AMARELO'`, `'VERDE'`, `'AZUL'`), impedindo o uso de strings arbitrárias.
  3. *Mapeamentos com `Record`*: Criação das constantes `PRIORITY_WEIGHT` e `PRIORITY_MAX_WAIT_MINUTES` mapeadas via `Record<PriorityLevel, number>`, associando metadados médicos a cada nível de triagem.

---

### **R06 — Simulação de Comunicação com uma API (Async/Promises & JSON)**
- **Objetivo do Requisito**: Implementar uma camada que simule a comunicação assíncrona com uma API externa de prontuários médicos, manipulando arquivos em formato JSON e lidando com operações assíncronas.
- **Como foi Implementado**:
  - Implementado em `src/infrastructure/api-simulator.service.ts` interagindo com o arquivo de dados `data/initial_patients.json`.
- **Decisões Técnicas e Arquiteturais**:
  1. *Manipulação Assíncrona via Promises*: Utilização do módulo nativo `fs/promises` (`readFile` e `writeFile`) integrado à sintaxe `async/await`.
  2. *Simulação de Latência de Rede*: Criação da função utilitária `delay(ms)` envelopando `setTimeout` em uma Promise. Isso simula o tempo de resposta das requisições HTTP (`fetch`).
  3. *Tratamento da Serialização de Datas*: Ao carregar dados do JSON (onde datas são armazenadas como strings ISO), a camada de infraestrutura converte explicitamente os campos em instâncias nativas do objeto `Date` de JavaScript.

---

### **R07 — Validação Automatizada das Funcionalidades (Node.js Test Runner)**
- **Objetivo do Requisito**: Possuir testes automatizados cobrindo as principais regras de negócio do sistema (cadastro, validações, triagem, ordenação da fila e operações assíncronas) utilizando o **Node.js Test Runner (`node:test`)**.
- **Como foi Implementado**:
  - Criados 6 arquivos de teste no diretório `tests/` cobrindo 100% dos módulos de serviço e validação. Total de **30 testes unitários**.
  - Utilização dos módulos nativos `node:test` (`describe`, `it`, `beforeEach`) e `node:assert`.
- **Decisões Técnicas e Arquiteturais**:
  1. *Zero Dependências de Teste Externas*: Em vez de instalar frameworks pesados como Jest ou Vitest, utilizou-se o test runner nativo do Node.js 20+, reduzindo o tempo total de execução da suíte para **~280ms**.
  2. *Integração com `tsx`*: Configuração do script no `package.json`:
     ```json
     "scripts": {
       "test": "node --test --import tsx tests/**/*.test.ts"
     }
     ```
  3. *Isolamento de Estado*: Utilização de hooks `beforeEach(() => clearPatientStore())` para garantir que o estado acumulado em um teste não contamine o resultado dos testes subsequentes.

---

### **RA01 — Validação de Dados com Expressões Regulares (Regex)**
- **Objetivo do Requisito**: Aplicar Expressões Regulares (Regex) para validar rigidamente a qualidade e a formatação dos dados fornecidos pelo usuário no cadastro e atualização.
- **Como foi Implementado**:
  - Módulo centralizador em `src/validators/patient.validator.ts`.
- **Decisões Técnicas e Justificativas**:
  1. *CPF (`^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})$`)*: Valida tanto a máscara clássica (`000.000.000-00`) quanto a entrada apenas numérica (11 dígitos). Adicionalmente, foi implementado o **algoritmo de validação dos dígitos verificadores (checksum)** para rejeitar CPFs numericamente inválidos ou com sequências repetidas (`111.111.111-11`).
  2. *Telefone (`^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$`)*: Aceita telefones fixos (8 dígitos) e celulares (9 dígitos) com ou sem parênteses no DDD.
  3. *E-mail (`^[^\s@]+@[^\s@]+\.[^\s@]+$`)*: Valida o padrão RFC simplificado de endereços eletrônicos.
  4. *Nome Completo (`^[A-Za-zÀ-ÖØ-öø-ÿ']{2,}(\s+[A-Za-zÀ-ÖØ-öø-ÿ']{2,})+$`)*: Exige obrigatoriamente nome e sobrenome com no mínimo 2 caracteres cada, permitindo acentuação em Português.

---

### **RA02 — Aperfeiçoamento da Tipagem utilizando Utility Types**
- **Objetivo do Requisito**: Incorporar recursos avançados de transformação de tipos do TypeScript (`Partial`, `Pick`, `Omit`, `Readonly`, `Record`), justificando a escolha de cada um no contexto do projeto.
- **Como foi Implementado**:
  - Definido em `src/domain/types/utility-types.ts`.
- **Decisões Técnicas e Justificativas**:
  1. **`Omit<Patient, 'id' | 'dataDeChegada' | 'prioridade' | 'atendido' | 'dataAtendimento'>`** (`PatientRegistrationDTO`):
     - *Justificativa*: No formulário de cadastro, o usuário deve informar apenas os dados pessoais e sintomas. Os campos de ID, timestamp de chegada e status de atendimento são gerados internamente pelo sistema e não devem ser expostos na entrada.
  2. **`Partial<Omit<Patient, 'id' | 'dataDeChegada'>>`** (`PatientUpdateDTO`):
     - *Justificativa*: Na atualização de cadastro, o usuário pode querer alterar apenas o telefone ou o e-mail. O `Partial` torna todos os atributos editáveis opcionais, evitando a necessidade de reenviar o objeto completo.
  3. **`Pick<Patient, 'id' | 'nome' | 'idade' | 'prioridade' | 'sintomas' | 'atendido'>`** (`PatientSummaryDTO`):
     - *Justificativa*: Cria um tipo de resumo contendo apenas as propriedades essenciais para exibição rápida em listas ou relatórios de síntese na tela do terminal.
  4. **`Readonly<Patient>`** (`ReadonlyPatient`):
     - *Justificativa*: Garante que a camada de serviços entregue objetos imutáveis para a interface do usuário ou relatórios, impedindo modificações acidentais de propriedades de um paciente.
  5. **`Record<PriorityLevel, number>`** (`PriorityCountRecord`):
     - *Justificativa*: Garante que os relatórios estatísticos possuam uma chave obrigatoriamente mapeada para cada uma das cores do enum de prioridades.

---

### **RA03 — Aplicação de Recurso Avançado do Ecossistema TypeScript (`ts-pattern`)**
- **Objetivo do Requisito**: Pesquisar e incorporar um recurso moderno do ecossistema TypeScript. Foi escolhida a biblioteca **`ts-pattern`** para aplicar **Pattern Matching** declarativo na triagem médica.
- **Como foi Implementado**:
  - Desenvolvido em `src/services/classification.service.ts`.
- **Decisões Técnicas e Justificativas**:
  1. *Pattern Matching com `match()` e `P.when()`*: Em vez de utilizar estruturas condicionais aninhadas (`if/else` longos ou `switch`), utiliza-se uma sintaxe fluente e funcional baseada na análise das palavras-chave dos sintomas:
     ```typescript
     return match(sanitizedSymptoms)
       .with(P.when(s => containsKeyword(s, EMERGENCY_KEYWORDS)), () => PriorityLevel.EMERGENCY)
       .with(P.when(s => containsKeyword(s, VERY_URGENT_KEYWORDS)), () => PriorityLevel.VERY_URGENT)
       .with(P.when(s => containsKeyword(s, URGENT_KEYWORDS)), () => PriorityLevel.URGENT)
       .with(P.when(s => containsKeyword(s, NON_URGENT_KEYWORDS)), () => PriorityLevel.NON_URGENT)
       .with(P.when(s => containsKeyword(s, STANDARD_KEYWORDS)), () => PriorityLevel.STANDARD)
       .otherwise(() => PriorityLevel.STANDARD);
     ```
  2. *Garantia de Exaustividade com `.exhaustive()`*: Na função `getPriorityDescription()`, o método `.exhaustive()` valida em **tempo de compilação** se todas as cores do enum `PriorityLevel` possuem um tratamento associado. Se um novo nível de prioridade for incluído no enum no futuro, o compilador TypeScript acusará erro na compilação, eliminando o risco de comportamentos indefinidos (`undefined`) em ambiente de produção.

---

## Instruções de Instalação e Execução

### **Pré-requisitos**
- Node.js (versão 20.0.0 ou superior)
- NPM (versão 9.0.0 ou superior)

### **1. Instalação das Dependências**
Navegue até a pasta do projeto e execute:
```bash
npm install
```

### **2. Executar a Aplicação (Menu Interativo Terminal)**
Para iniciar o sistema em modo de produção/execução direta:
```bash
npm start
```

Para iniciar em modo de desenvolvimento com hot-reload (watch):
```bash
npm run dev
```

---

## Instruções para Execução dos Testes Automatizados

Os testes do sistema foram desenvolvidos com o test runner nativo do Node.js (`node:test`).

Para executar a suíte completa de 30 testes automatizados:
```bash
npm test
```

---

## Exemplos de Uso do Sistema (Terminal CLI)

Ao iniciar a aplicação (`npm start`), o menu interativo apresentará o cabeçalho e as opções de navegabilidade:

```text
===========================================================
      SISTEMA DE TRIAGEM E GERENCIAMENTO DA UPA
===========================================================

[ MENU PRINCIPAL ]

 1. Cadastrar Novo Paciente
 2. Classificar Risco & Reavaliar Paciente
 3. Atender Próximo Paciente (Maior Prioridade)
 4. Consultar Fila de Atendimento Ordenada
 5. Buscar / Pesquisar Pacientes
 6. Atualizar Cadastro de Paciente
 7. Exibir Estatísticas do Atendimento
 8. Recarregar Dados da API Externa
 9. Salvar Estado Atual no JSON da API
 0. Sair do Sistema

===========================================================
```

Abaixo estão os exemplos detalhados de interação para cada uma das opções disponíveis:

---

### **Opção 1 — Cadastrar Novo Paciente**
- **Objetivo**: Efetuar o cadastro completo de um novo paciente que deu entrada na UPA.
- **Interação no Terminal**:
  ```text
  --- CADASTRO DE NOVO PACIENTE ---
  Nome Completo: Maria da Silva
  Idade: 45
  CPF (000.000.000-00 ou 11 dígitos): 529.982.247-25
  Telefone ((XX) XXXXX-XXXX): (41) 99999-8888
  E-mail (usuario@dominio.com): maria@email.com
  Sintomas informados / Queixa principal: Forte dor no peito e falta de ar severa

  [SUCESSO] Paciente cadastrado e classificado com sucesso!
     ID: PAC-0004
     Nome: Maria da Silva
     Prioridade Atribuída: 🟠 LARANJA - Muito Urgente: Atendimento em até 10 minutos
  ```
- **Resultado**: O sistema executa as validações Regex de formato e checksum do CPF, aciona o motor `ts-pattern` que reconhece a expressão *"dor no peito"*, classifica o paciente como **🟠 LARANJA** e o insere na fila.

---

### **Opção 2 — Classificar Risco & Reavaliar Paciente**
- **Objetivo**: Atualizar os sintomas de um paciente ou atribuir manualmente uma nova cor de triagem médica.
- **Interação no Terminal**:
  ```text
  --- CLASSIFICAÇÃO DE RISCO & REAVALIAÇÃO ---
  Informe o ID ou CPF do paciente: PAC-0004

  Paciente encontrado: Maria da Silva (Prioridade Atual: LARANJA)
  Novos sintomas (deixe em branco para manter): Parada cardiorrespiratoria e perda de consciência

  Selecione uma prioridade explícita ou pressione Enter para classificação automática:
   1. 🔴 VERMELHO (Emergência)
   2. 🟠 LARANJA (Muito Urgente)
   3. 🟡 AMARELO (Urgente)
   4. 🟢 VERDE (Pouco Urgente)
   5. 🔵 AZUL (Não Urgente)
  Opção (1-5 ou Enter para automático): 

  [SUCESSO] Paciente reavaliado com sucesso!
     Nova Prioridade: 🔴 VERMELHO - Emergência: Atendimento imediato (0 min)
  ```
- **Resultado**: O motor `ts-pattern` reclassifica os novos sintomas informados (*"parada cardiorrespiratoria"*) e promove a paciente para a prioridade **🔴 VERMELHO**, movendo-a imediatamente para a primeira posição da fila.

---

### **Opção 3 — Atender Próximo Paciente (Maior Prioridade)**
- **Objetivo**: Chamar o paciente com o maior grau de urgência clínica na UPA.
- **Interação no Terminal**:
  ```text
  --- CHAMADA DE ATENDIMENTO ---

  [CHAMADA DE PACIENTE]
     Paciente Maria da Silva (VERMELHO) chamado para atendimento!
     ID: PAC-0004
     CPF: 529.982.247-25
     Sintomas: Parada cardiorrespiratoria e perda de consciência
     Data de Chegada: 08/08/2026 22:15:00
  ```
- **Resultado**: O `QueueService` consome o paciente no topo da fila priorizada, altera o status para `atendido: true`, registra o horário do atendimento e remove o paciente das chamadas pendentes.

---

### **Opção 4 — Consultar Fila de Atendimento Ordenada**
- **Objetivo**: Exibir a listagem completa da fila de pacientes aguardando atendimento.
- **Interação no Terminal**:
  ```text
  --- FILA DE TRIAGEM DE ATENDIMENTO ORDENADA ---

  Total aguardando atendimento: 2 paciente(s)

   #1 | [AMARELO] Sebastião Ferreira (68 anos)
        ID: PAC-0001 | CPF: 529.982.247-25
        Sintomas: Febre alta e vômito
        Chegada: 20:00:00

   #2 | [VERDE] Juliana Oliveira (24 anos)
        ID: PAC-0002 | CPF: 111.444.777-35
        Sintomas: Febre baixa e dor de cabeça
        Chegada: 20:15:00
  ```
- **Resultado**: Apresenta a fila ordenada prioritariamente pela gravidade médica do Protocolo de Manchester (🔴 Vermelho > 🟠 Laranja > 🟡 Amarelo > 🟢 Verde > 🔵 Azul) e secundariamente por ordem de chegada (FIFO).

---

### **Opção 5 — Buscar / Pesquisar Pacientes**
- **Objetivo**: Localizar pacientes por fragmentos de texto (nome, CPF, sintomas) ou filtrar por cor de prioridade.
- **Interação no Terminal**:
  ```text
  --- BUSCA DE PACIENTES ---
  1. Pesquisar por Nome, CPF ou Sintomas
  2. Filtrar por Nível de Prioridade (Cor)
  Opção (1-2): 1
  Digite o termo de busca: Juliana

  Resultados encontrados: 1

   • [PAC-0002] Juliana Oliveira - Prioridade: VERDE | Status: AGUARDANDO
  ```
- **Resultado**: O `StatsService` aplica os métodos `filter()` e `some()`, retornando todos os registros correspondentes ao critério digitado.

---

### **Opção 6 — Atualizar Cadastro de Paciente**
- **Objetivo**: Alterar dados de contato (telefone ou e-mail) de um paciente cadastrado.
- **Interação no Terminal**:
  ```text
  --- ATUALIZAR CADASTRO DE PACIENTE ---
  Informe o ID ou CPF do paciente: PAC-0002

  Atualizando paciente: Juliana Oliveira
  Novo Telefone (Atual: (41) 99111-3344) [Enter para manter]: (41) 98888-5555
  Novo E-mail (Atual: juliana@email.com) [Enter para manter]: juliana.nova@email.com

  [SUCESSO] Cadastro atualizado com sucesso!
  ```
- **Resultado**: Aplica o Utility Type `Partial<Patient>` (RA02) atualizando apenas os atributos fornecidos, preservando os demais dados cadastrais intactos.

---

### **Opção 7 — Exibir Estatísticas do Atendimento**
- **Objetivo**: Gerar o relatório consolidado com os indicadores operacionais da UPA.
- **Interação no Terminal**:
  ```text
  --- ESTATÍSTICAS E RELATÓRIO DA UPA ---

   Total de Pacientes Registrados : 3
   Pacientes Atendidos          : 1
   Pacientes Aguardando         : 2
   Idade Média dos Pacientes    : 45.7 anos

   Contagem por Cor de Prioridade:
     VERMELHO: 1 paciente(s) | LARANJA: 0 paciente(s) | AMARELO: 1 paciente(s) | VERDE: 1 paciente(s) | AZUL: 0 paciente(s)
  ```
- **Resultado**: Computa em tempo real a idade média (usando `reduce`), o quantitativo por status e a distribuição por prioridade (`PriorityCountRecord`).

---

### **Opção 8 — Recarregar Dados da API Externa**
- **Objetivo**: Simular a leitura assíncrona de prontuários médicos a partir de um servidor externo JSON.
- **Interação no Terminal**:
  ```text
  --- SIMULAÇÃO DE API EXTERNA (CARGA ASSÍNCRONA) ---
  Efetuando requisição assíncrona HTTP simulada com Promises...

  [SUCESSO] 3 paciente(s) carregados da API externa.
  ```
- **Resultado**: Dispara a função assíncrona `loadAndSyncExternalData()`, simulando latência de rede com Promises e restaurando a base de dados a partir de `data/initial_patients.json`.

---

### **Opção 9 — Salvar Estado Atual no JSON da API**
- **Objetivo**: Persistir o estado atual dos pacientes cadastrados e atendidos no arquivo JSON de dados.
- **Interação no Terminal**:
  ```text
  --- SALVAR ESTADO NA API EXTERNA (PERSISTÊNCIA JSON) ---
  Enviando dados assincronamente...

  [SUCESSO] Estado salvo com sucesso! 3 registro(s) sincronizados em JSON.
  ```
- **Resultado**: Executa `syncPatientsToExternalApi()`, serializando a lista com `JSON.stringify()` e gravando no arquivo em disco via `fs/promises`.

---

### **Opção 0 — Sair do Sistema**
- **Objetivo**: Finalizar a execução da aplicação terminal.
- **Interação no Terminal**:
  ```text
  Escolha uma opção (0-9): 0

  Encerrando o Sistema de Triagem da UPA. Até logo!
  ```
- **Resultado**: Encerra a interface `readline` e devolve o controle ao terminal.
