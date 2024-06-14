const axios = require("axios");
const inbotDB = require("./inbot.db.service");
const util = require("./util");
const { Exception } = require("handlebars");
const WhatsAppInteractionRepository = require("../repository/WhatsAppInteractionRepository");

const sendTemplate = async function (botId, templateId, senderPhone, dataClient, payloads, campaignId) {
  // Pegando dados do remetente
  let vSQL =
    "select * from smartersNumber where number = '" +
    senderPhone +
    "' AND botId=" +
    botId;
  let dbInbot;
  await inbotDB.crud(vSQL).then(function (resp) {
    dbInbot = resp;
  });

  for (let j = 0; j < dataClient.length; j++) {
    let dataValues = "";
    if (dataClient[j].data) {
      for (let i = 0; i < dataClient[0].data.length; i++) {
        const nome = dataClient[j].data[i].name;
        const values = dataClient[j].data[i].value;
        dataValues += `&setvar=${nome}=${values}`;
      }
    }
    try {
      if (!util.isHasOwnProperty(dbInbot[0], "accessToken")) {
        throw new Exception("Parametros invalidos");
      }
      console.log(dataValues)
      const url = "https://whatsapp.smarters.io/api/v1/send";
      const token = dbInbot[0].accessToken;
      let body_params = {
        header: {
          receiver: dataClient[j].receiverPhone,
          contentType: "notification",
        },
        content: {
          notification: {
            name: templateId,
            locale: "pt_BR",
            components: []
          },
        },
      };

      if (payloads !== undefined) {
        let payloadButton = []
        payloads.map((v, index) => payloadButton.push({
          type: "quickReply",
          payload: {
            value: v, index: index
          }
        })
        );
        if (payloadButton.length > 0) {
          body_params.content.notification.components.push(
            {
              type: "button",
              parameters: payloadButton
            }
          )
        }
      }
      if (util.isHasOwnProperty(dataClient[j], "variables")) {
        let parameters = [];
        dataClient[j].variables.map((v) => parameters.push({ type: "text", text: v }));
        if (parameters.length > 0) {
          body_params.content.notification.components.push(
            {
              type: "body",
              parameters: parameters,
            },
          );
        }
      }
      if (dataClient[j].type_header && dataClient[j].type_header !== "text") {
        let parameters = [{
          type: dataClient[j].type_header,
          [dataClient[j].type_header]: { link: dataClient[j].url_header }
        }];
        if (parameters.length > 0) {
          body_params.content.notification.components.push(
            {
              type: "header",
              parameters: parameters,
            },
          );
        }
      }
   
      let customer = await WhatsAppInteractionRepository.getByBotPhoneBotIdUserPhone(botId,dataClient[j].receiverPhone,senderPhone);
      let sessionExpired = false;
      let sessionId = null;
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
    if(!customer || sessionExpired){
        sessionId = util.sessionGenerator(32);
        const escalation = 0;
        await WhatsAppInteractionRepository.createNewSession(senderPhone, dataClient[j].receiverPhone, botId, sessionId, escalation, lastMessage, "")
          .catch(error => console.log(new Date(), `Erro ao criado usuario ${JSON.stringify(error)}`))
        customer = await WhatsAppInteractionRepository.getByBotPhoneBotIdUserPhone(botId,dataClient[j].receiverPhone,senderPhone)
        customer = customer[0];
      } else {
        await WhatsAppInteractionRepository.updateCustomer(botId,dataClient[j].receiverPhone,senderPhone,lastMessage,"",customer.sessionId);
      }

      console.log(new Date(), `https://in.bot/api/bot_gateway?bot_id=${botId}&user_id=${dataClient[j].receiverPhone}&session_id=${sessionId}&bot_token=${dbInbot[0].botToken}&user_phrase=ATIVO_WHATSAPP ${templateId}&json=1&bot_server_type=${dbInbot[0].botServerType}&channel=whatsapp${dataValues}`);
      console.log(new Date(), JSON.stringify(body_params));

      try {
        axios.get(`https://in.bot/api/bot_gateway?bot_id=${botId}&user_id=${dataClient[j].receiverPhone}&session_id=${sessionId}&bot_token=${dbInbot[0].botToken}&user_phrase=ATIVO_WHATSAPP ${templateId}&json=1&bot_server_type=${dbInbot[0].botServerType}&channel=whatsapp${dataValues}`)
          .then(resp => console.log(resp.data))
      } catch (error) {
            console.log(error)
      }
      let currentDate = new Date().toISOString();
      console.log("%s payload envio do template whats: %o", new Date(), body_params);
      axios
        .post(url, body_params, { headers: { Authorization: token } })
        .then((res) => {
          console.log("%s response apos envio do template whats: %o", new Date(), res.data)
          if (campaignId) {
            let vSQL =
            "UPDATE templateTriggeringCustomer SET status='enviado', data_disparo= '" +
            currentDate +
            "' where campaign_id = '" +
            campaignId +
            "' AND phone='" +
            dataClient[j].receiverPhone +
            "'";
            inbotDB.crud(vSQL)
          }
        })
        .catch((err) => {
          console.log("%s response ERROR apos envio do template whats: %o", new Date(), err.response.data)
          if (campaignId) {
            let vSQL =
            "UPDATE templateTriggeringCustomer SET status='erro', data_disparo= '" +
            currentDate +
            "' where campaign_id = '" +
            campaignId +
            "' AND phone='" +
            dataClient[j].receiverPhone +
            "'";
            inbotDB.crud(vSQL)
          }
        });
    } catch (error) {
        let currentDate = new Date().toISOString();
      console.log("%s response ERROR apos envio do template whats: %o", new Date(), error)
      if (campaignId) {
        let vSQL =
        "UPDATE templateTriggeringCustomer SET status='erro', data_disparo= '" +
        currentDate +
        "' where campaign_id = '" +
        campaignId +
        "' AND phone='" +
        dataClient[j].receiverPhone +
        "'";
        inbotDB.crud(vSQL)
      }
    }
  }
  // console.log(JSON.stringify(body_params));
};
module.exports = { sendTemplate };
