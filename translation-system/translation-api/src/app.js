const express = require('express');
const { syncDatabase } = require('./models/Translation');
const { connectRabbitMQ } = require('./utils/rabbitmq');
const translationRoutes = require('./routes/translationRoutes');
const config = require('./config');

const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Rotas da API
app.use('/', translationRoutes);

// Inicializa a aplicação
async function startServer() {
    await syncDatabase();      // Conecta e sincroniza o banco de dados
    await connectRabbitMQ();   // Conecta ao RabbitMQ

    app.listen(config.port, () => {
        console.log(`Translation API rodando na porta ${config.port}`);
    });
}

startServer();
