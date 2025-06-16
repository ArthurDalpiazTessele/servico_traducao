require('dotenv').config();

module.exports = {
    port: process.env.PORT || 5000,
    databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/translation_db',
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    translationQueue: 'translation_requests_queue' // Nome da fila
};
