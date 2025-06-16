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

// Sincroniza o modelo com o banco de dados (cria a tabela se não existir)
async function syncDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Conexão com o banco de dados estabelecida com sucesso.');
        await Translation.sync({ alter: true }); // Use { alter: true } para atualizar tabelas existentes sem dropar dados
        console.log('Tabela de Traduções sincronizada.');
    } catch (error) {
        console.error('Não foi possível conectar ou sincronizar o banco de dados:', error);
        process.exit(1); // Sai do processo se a conexão falhar
    }
}

module.exports = { Translation, syncDatabase, sequelize };
