const amqp = require('amqplib');
const config = require('../config');

let channel = null;
let connection = null;

async function connectRabbitMQ() {
    try {
        connection = await amqp.connect(config.rabbitmqUrl);
        channel = await connection.createChannel();
        await channel.assertQueue(config.translationQueue, { durable: true });
        console.log(`Conectado ao RabbitMQ e fila '${config.translationQueue}' assegurada.`);

        connection.on('error', (err) => {
            console.error('[RabbitMQ Connection Error]', err.message);
            // Tentar reconectar após um atraso em caso de erro
            setTimeout(connectRabbitMQ, 5000);
        });
        connection.on('close', () => {
            console.error('[RabbitMQ Connection Closed] Tentando reconectar...');
            // Tentar reconectar após um atraso em caso de fechamento
            setTimeout(connectRabbitMQ, 5000);
        });

    } catch (error) {
        console.error('Falha ao conectar ao RabbitMQ:', error.message);
        // Tentar reconectar após um atraso em caso de falha inicial
        setTimeout(connectRabbitMQ, 5000);
    }
}

function publishMessage(message) {
    if (!channel) {
        console.error('Canal RabbitMQ não está disponível. Mensagem não publicada.');
        return false;
    }
    try {
        // Envia a mensagem para a fila. persistente: true para garantir que a mensagem não se perca se o RabbitMQ reiniciar.
        channel.sendToQueue(config.translationQueue, Buffer.from(JSON.stringify(message)), { persistent: true });
        return true;
    } catch (error) {
        console.error('Erro ao publicar mensagem:', error.message);
        return false;
    }
}

module.exports = {
    connectRabbitMQ,
    publishMessage,
    getChannel: () => channel // Utilitário para acessar o canal se necessário
};
