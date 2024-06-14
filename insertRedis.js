const redis = require('redis');

const url_redis = "redis://localhost:6379";

async function run() {
    const client = await redis.createClient({ url: url_redis })
    .on('error', err => console.log('Redis Client Error', err))
    .connect();
  
  console.log("Conexão estabelecida com o Redis");

  const whatsappData = {
    botId: 571,
    templateId: 'template_a_exames',
    triggerId: 278,
    senderPhone: '551150804100',
    payloads: ['CONFIRM_AGENDA_EXAME 18225780', 'CONFIRM_AGENDA_EXAME_NOSHOW 18225780'],
    dataClient: [
      {
        receiverPhone: '5511999113863',
        variables: ['Eduardo', 'DOPPLER TIREOIDE', '12/06/2024', '13:30'],
        type_header: null,
        url_header: null
      }
    ]
  };


const rpush = await client.rPush("whatsapp", JSON.stringify(whatsappData))

console.log('Item adicionado à fila:', whatsappData);
console.log(new Date(), `RPUSH: ${JSON.stringify(rpush)}`)
client.quit();
}

run().catch(console.error);
