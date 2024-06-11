const { createClient } = require("redis");
const util = require("../../root/controllers/util");
const template = require("../services/smarters.template.service")
const config = require("../../../config/default.json")
const url_redis = "redis://inbot-vpc.ph02sx.0001.use1.cache.amazonaws.com:6379";

async function enqueueAndPublish(queueName, item) {
    const client = await createClient({ url: url_redis })
        .on('error', err => console.log('Redis Client Error', err))
        .connect();
    const rpush = await client.rPush(queueName, JSON.stringify(item))

    console.log('Item adicionado à fila:', item);
    console.log(new Date(), `RPUSH: ${JSON.stringify(rpush)}`)
    client.quit();
}


// Função para processar um item da fila
async function processQueue(queueName) {
    try {
        const client = await createClient({ url: url_redis })
            .on('error', err => console.log('Redis Client Error', err))
            .connect();
        console.log("Conexão estabelecida com o Redis");

        while (true) {
            // Lendo o próximo item da fila
            const item = await client.blPop(queueName, 30);
            console.log('Item processado:', item);

            if (!item || item === null) {
                console.log('Fila vazia');
            } else {

                const { botId, templateId, senderPhone, dataClient, payloads, triggerId } = JSON.parse(item.element);
                try {
                    // Enviando o template
                    const resp = await template.sendTemplate(botId, templateId, senderPhone, dataClient, payloads, triggerId);
                    if (resp == 404) {
                        console.error('Dados faltantes ou inválidos');
                        return;
                    }
                    console.log('Enviado com sucesso');
                } catch (error) {
                    console.error('Erro ao enviar template:', error);
                }
            }
            await util.sleep(10);
        }
    } catch (error) {
        console.error('Erro ao conectar ao cliente Redis:', error);
    }
}

module.exports = {
    processQueue,
    enqueueAndPublish,
}