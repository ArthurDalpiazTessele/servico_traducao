const express = require('express');
const router = express.Router();
const { Translation } = require('../models/Translation');
const { publishMessage } = require('../utils/rabbitmq');

router.post('/translations', async (req, res) => {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
        return res.status(400).json({ error: "Missing 'text' or 'targetLanguage' in request body" });
    }

    try {
        const newTranslation = await Translation.create({
            originalText: text,
            targetLanguage: targetLanguage,
            status: 'queued',
        });

        const message = {
            requestId: newTranslation.requestId,
            originalText: newTranslation.originalText,
            targetLanguage: newTranslation.targetLanguage
        };

        const published = publishMessage(message);

        if (!published) {
            // Se a mensagem não puder ser publicada (ex: RabbitMQ desconectado),
            // podemos considerar a requisição como falha inicial ou tentar novamente.
            // Para simplicidade, vamos marcar como falha por enquanto.
            newTranslation.status = 'failed';
            await newTranslation.save();
            return res.status(500).json({ error: 'Failed to queue translation request. RabbitMQ might be down.' });
        }

        return res.status(202).json({
            requestId: newTranslation.requestId,
            status: newTranslation.status,
            message: 'Translation request received and queued.'
        });

    } catch (error) {
        console.error('Error creating translation request:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

router.get('/translations/:requestId', async (req, res) => {
    const { requestId } = req.params;

    try {
        const translation = await Translation.findOne({ where: { requestId } });

        if (!translation) {
            return res.status(404).json({ error: 'Translation request not found.' });
        }

        return res.status(200).json({
            requestId: translation.requestId,
            originalText: translation.originalText,
            translatedText: translation.translatedText,
            targetLanguage: translation.targetLanguage,
            status: translation.status,
            createdAt: translation.createdAt,
            updatedAt: translation.updatedAt,
        });

    } catch (error) {
        console.error('Error fetching translation status:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
