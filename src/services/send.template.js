const axios = require("axios");
const inbotDB = require("./inbot.db.service");
const utils = require("./util");
const { Exception } = require("handlebars");

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
      if (!utils.isHasOwnProperty(dbInbot[0], "accessToken")) {
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
      if (utils.isHasOwnProperty(dataClient[j], "variables")) {
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

      let currentDate = new Date().toISOString();
      console.log("%s payload envio do template whats: %o", new Date(), body_params);
      await axios
        .post(url, body_params, { headers: { Authorization: token } })
        .then(async (res) => {
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
            await inbotDB.crud(vSQL)
          }
        })
        .catch(async (err) => {
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
            await inbotDB.crud(vSQL)
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
        await inbotDB.crud(vSQL)
      }
    }
  }
  // console.log(JSON.stringify(body_params));
};
module.exports = { sendTemplate };
