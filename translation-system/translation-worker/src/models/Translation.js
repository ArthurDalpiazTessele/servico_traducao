// Este arquivo é essencialmente o mesmo que em translation-api/src/models/Translation.js
// pois ambos os serviços precisam interagir com a mesma estrutura de banco de dados.
// Em um projeto real, você poderia ter um módulo compartilhado para modelos de DB.
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');

const sequelize = new Sequelize(config.databaseUrl, {
    dialect: 'postgres',
    logging: false, // Desabilita logs de SQL no console
});

const Translation = sequelize.define('Translation', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    requestId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
        allowNull: false,
    },
    originalText: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    translatedText: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    targetLanguage: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'queued', // queued, processing, completed, failed
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        onUpdate: DataTypes.NOW,
    },
}, {
    tableName: 'translations', // Nome da tabela no banco de dados
    timestamps: true, // Habilita createdAt e updatedAt
    updatedAt: 'updatedAt', // Define o nome da coluna para updatedAt
    createdAt: 'createdAt' // Define o nome da coluna para createdAt
});

async function syncDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Conexão com o banco de dados estabelecida com sucesso no worker.');
        // O worker não precisa criar/alterar tabelas, mas garantir a conexão é bom.
        // As tabelas serão criadas pelo Translation API na primeira execução.
    } catch (error) {
        console.error('Não foi possível conectar ao banco de dados no worker:', error);
        process.exit(1);
    }
}

module.exports = { Translation, syncDatabase };
