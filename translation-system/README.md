# Sistema de Tradução Assíncrono com Node.js, PostgreSQL e RabbitMQ

---

Este projeto demonstra uma arquitetura de microserviços assíncrona para tradução de textos, utilizando Node.js, Express, Sequelize, PostgreSQL para persistência de dados e RabbitMQ para gerenciamento de filas de mensagens.

## Visão Geral da Arquitetura

O sistema é composto por três serviços principais que se comunicam através de um sistema de fila de mensagens:

1.  **`translation-api` (API REST)**: Responsável por receber requisições de tradução, enfileirá-las e fornecer o status de processamento.
2.  **`translation-worker` (Serviço Consumidor)**: Escuta a fila de mensagens, processa as requisições de tradução (simuladas) e atualiza o status no banco de dados.
3.  **`db` (PostgreSQL)**: Banco de dados relacional para armazenar os detalhes das requisições de tradução e seus status.
4.  **`rabbitmq` (RabbitMQ)**: Um broker de mensagens que atua como a fila central para a comunicação assíncrona entre a API e o worker.

### Fluxo de Funcionamento

1.  Um cliente envia uma requisição **POST** para a `translation-api` com o texto a ser traduzido e o idioma de destino.
2.  A `translation-api` gera um `requestId` (UUID), armazena a requisição no **PostgreSQL** com o status `queued` e envia uma mensagem para a fila do **RabbitMQ**.
3.  A `translation-api` responde imediatamente ao cliente com o `requestId` e o status `queued`, indicando que a requisição foi aceita e será processada assincronamente.
4.  O `translation-worker` consome a mensagem da fila do **RabbitMQ**.
5.  Ao receber a mensagem, o `translation-worker` atualiza o status da requisição no **PostgreSQL** para `processing`.
6.  O `translation-worker` simula o processo de tradução (com um atraso de 5 segundos) usando um dicionário mockado.
7.  Após a "tradução", o `translation-worker` atualiza o status no **PostgreSQL** para `completed` e salva o texto traduzido.
8.  O cliente pode, a qualquer momento, usar um endpoint **GET** na `translation-api` com o `requestId` para verificar o status atual e o resultado da tradução.

---

## Tecnologias Utilizadas

* **Node.js**: Ambiente de execução JavaScript.
* **Express.js**: Framework web para a API REST.
* **Sequelize**: ORM (Object-Relational Mapper) para interação com o PostgreSQL.
* **PostgreSQL**: Banco de dados relacional.
* **RabbitMQ**: Broker de mensagens para comunicação assíncrona.
* **Docker & Docker Compose**: Para orquestração e gerenciamento dos serviços em contêineres.

---

## Como Rodar o Projeto

Este projeto utiliza Docker Compose para facilitar a configuração e execução de todos os serviços.

### Pré-requisitos

* **Docker Desktop** (ou Docker Engine e Docker Compose) instalado em sua máquina.

### Passos para Execução

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    cd sistema-de-traducao-assincrono # Ou o nome da sua pasta raiz do projeto
    ```

2.  **Construa e Inicie os Contêineres:**
    Navegue até o diretório raiz do projeto onde o arquivo `docker-compose.yml` está localizado e execute:

    ```bash
    docker-compose up --build
    ```
    * `docker-compose up`: Inicia os serviços definidos no `docker-compose.yml`.
    * `--build`: Garante que as imagens Docker para a API e o Worker sejam reconstruídas, incorporando quaisquer alterações recentes no código.

    Você deverá ver os logs de inicialização de todos os serviços: `db`, `rabbitmq`, `translation-api` e `translation-worker`.

3.  **Verifique o Status dos Contêineres:**
    Abra um novo terminal (mantendo o `docker-compose up` rodando no primeiro) e execute:

    ```bash
    docker-compose ps
    ```
    Todos os serviços (`db`, `rabbitmq`, `translation-api`, `translation-worker`) devem estar com o status `Up`.

---

## Endpoints da API

A API estará disponível em `http://localhost:5000`.

### 1. Solicitar uma Tradução (POST)

Envia uma requisição de tradução para a fila.

* **URL:** `http://localhost:5000/translations`
* **Método:** `POST`
* **Headers:**
    * `Content-Type: application/json`
* **Corpo da Requisição (JSON):**
    ```json
    {
        "text": "Hello, how are you?",
        "targetLanguage": "es"
    }
    ```
    * `text`: O texto original a ser traduzido.
    * `targetLanguage`: O código do idioma de destino (ex: `es` para espanhol, `pt` para português, `fr` para francês).

* **Exemplo de Resposta (202 Accepted):**
    ```json
    {
        "requestId": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
        "status": "queued",
        "message": "Translation request received and queued."
    }
    ```

### 2. Consultar o Status da Tradução (GET)

Verifica o status e o resultado de uma requisição de tradução.

* **URL:** `http://localhost:5000/translations/{requestId}`
    * Substitua `{requestId}` pelo `requestId` obtido na resposta do POST.
* **Método:** `GET`

* **Exemplo de Resposta (Status `queued` ou `processing`):**
    ```json
    {
        "requestId": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
        "originalText": "Hello, how are you?",
        "translatedText": null,
        "targetLanguage": "es",
        "status": "processing",
        "createdAt": "2025-06-16T20:00:00.000Z",
        "updatedAt": "2025-06-16T20:00:05.000Z"
    }
    ```

* **Exemplo de Resposta (Status `completed`):**
    (Aguarde aproximadamente 5-10 segundos após o POST para o worker processar a tradução)
    ```json
    {
        "requestId": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
        "originalText": "Hello, how are you?",
        "translatedText": "hola, how are you?",
        "targetLanguage": "es",
        "status": "completed",
        "createdAt": "2025-06-16T20:00:00.000Z",
        "updatedAt": "2025-06-16T20:00:10.000Z"
    }
    ```

---

## Estrutura do Projeto
.
├── docker-compose.yml           # Define e orquestra os serviços Docker
├── translation-api/             # Serviço da API REST
│   ├── Dockerfile               # Imagem Docker para a API
│   ├── package.json             # Dependências Node.js da API
│   └── src/
│       ├── app.js               # Ponto de entrada da API
│       ├── config/              # Configurações (ex: DB, RabbitMQ)
│       │   └── ...
│       ├── models/              # Modelos do Sequelize (ex: Translation.js)
│       │   └── Translation.js
│       ├── routes/              # Definições de rotas da API
│       │   └── translationRoutes.js
│       └── utils/               # Utilitários (ex: logger, mock de tradução)
│           └── ...
├── translation-worker/          # Serviço consumidor da fila
│   ├── Dockerfile               # Imagem Docker para o Worker
│   ├── package.json             # Dependências Node.js do Worker
│   └── src/
│       ├── worker.js            # Ponto de entrada do Worker
│       ├── config/              # Configurações (ex: DB, RabbitMQ)
│       │   └── ...
│       ├── models/              # Modelos do Sequelize (reutilizado do API)
│       │   └── Translation.js
│       └── utils/               # Utilitários (ex: logger, mock de tradução)
│           └── ...
└── .env                         # Variáveis de ambiente (para DB e RabbitMQ URLs)

---

## Considerações Finais

Este projeto oferece uma base sólida para entender e implementar sistemas assíncronos com filas de mensagens. Para um ambiente de produção, outras considerações incluiriam:

* **API de Tradução Real:** Integrar com uma API de tradução de terceiros (Google Translate, DeepL, etc.).
* **Tratamento de Erros Mais Robustos:** Implementar filas de "dead-letter" para mensagens que falham repetidamente.
* **Escalabilidade:** Configurar múltiplos workers para processar mensagens em paralelo.
* **Observabilidade:** Adicionar monitoramento e alertas para os serviços e filas.
* **Segurança:** Implementar autenticação, autorização e gerenciamento de segredos.
