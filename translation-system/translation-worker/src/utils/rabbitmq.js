// Este arquivo é muito semelhante ao da API, mas focado no consumo de mensagens
const amqp = require('amqplib');
const config = require('../config');

let channel = null;
let connection = null;

async function connectRabbitMQ() {
    try {
        connection = await amqp.connect(config.rabbitmqUrl);
        channel = await connection.createChannel();
        await channel.assertQueue(config.translationQueue, { durable: true });
        console.log(`Worker conectado ao RabbitMQ e fila '${config.translationQueue}' assegurada.`);

        connection.on('error', (err) => {
            console.error('[Worker RabbitMQ Connection Error]', err.message);
            setTimeout(connectRabbitMQ, 5000); // Tentar reconectar
        });
        connection.on('close', () => {
            console.error('[Worker RabbitMQ Connection Closed] Tentando reconectar...');
            setTimeout(connectRabbitMQ, 5000); // Tentar reconectar
        });

        return channel;

    } catch (error) {
        console.error('Worker: Falha ao conectar ao RabbitMQ:', error.message);
        setTimeout(connectRabbitMQ, 5000); // Tentar reconectar
        return null;
    }
}

module.exports = {
    connectRabbitMQ,
    getChannel: () => channel
};
