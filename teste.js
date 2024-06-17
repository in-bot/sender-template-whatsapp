const util = require("./src/services/util");
const WhatsAppInteractionRepository = require("./src/repository/WhatsAppInteractionRepository");

async function teste(botId,receiverPhone,senderPhone){

let customer = await WhatsAppInteractionRepository.getByBotPhoneBotIdUserPhone(botId,receiverPhone,senderPhone);
let sessionExpired = false;
let sessionId = null;
console.log(new Date(), `Customer: ${customer}`)
/** Verifica se a sessão esta ativa (30min) caso não a flag sessionExpired ira para true
 * e cria uma nova */
if(customer.length > 0){
  customer = customer[0];
  const sessionDate = new Date(customer.lastMessage);
  sessionId = customer.sessionId;
  sessionDate.setMinutes(sessionDate.getMinutes() + 30);
  const now = new Date();
  sessionExpired = now > sessionDate;
}

/** Caso usuario não encontrado no banco, fazer um cadastro dele
* botPhone, userPhone, botId, sessionId, escalation, lastMessage (date)
*/
const lastMessage = util.dateToString(new Date(), "yyyy-MM-dd hh:mm:ss");
console.log(!customer)
if(customer.length===0 || !customer || sessionExpired){
    console.log("entrou")
  sessionId = util.sessionGenerator(32);
  const escalation = 0;
  await WhatsAppInteractionRepository.createNewSession(senderPhone, receiverPhone, botId, sessionId, escalation, lastMessage, "")
    .catch(error => console.log(new Date(), `Erro ao criado usuario ${JSON.stringify(error)}`))
  customer = await WhatsAppInteractionRepository.getByBotPhoneBotIdUserPhone(botId,receiverPhone,senderPhone)
  customer = customer[0];
} else {
  await WhatsAppInteractionRepository.updateCustomer(botId,receiverPhone,senderPhone,lastMessage,"",customer.sessionId);
  sessionId = customer.sessionId;
}
}

teste(999,"5511999113863","5599999999999");