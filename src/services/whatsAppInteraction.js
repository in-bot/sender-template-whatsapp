const util = require("./util");
const utils = require("../../smarters/controllers/util");
const inBot = require("../../inbot/controllers/chatbot.controller");
const inbotDB = require("../../inbot/services/inbot.db.service");
const config = require("config");
const {
  Exception
} = require("handlebars");
const {
  dateToString
} = require("./util");
const inbotConfig = config.get("inbot");

const check = async function (whatsAppInteraction) {
  // Pega infos
  let script = "select id, " +
    "                  sessionId, " +
    "                  escalation " +
    "           from whatsAppInteraction " +
    "           where botId = " + whatsAppInteraction.botId +
    "                 and userPhone = '" + whatsAppInteraction.userPhone + "'" +
    "                 and botPhone = '" + whatsAppInteraction.botPhone + "'" +
    "                 and lastMessage >= '" + util.dateToString(util.dateAddMinute(new Date(), -inbotConfig.timeOutSession), "yyyy-MM-dd hh:mm:ss") + "'";
  let senderReturn;
  await inbotDB.crud(script).then(function (resp) {
    console.log("Retornou algo")
    senderReturn = resp;
  });

  if (senderReturn === undefined) {
    let script = "select id, " +
      "                  sessionId, " +
      "                  escalation " +
      "                  session_id_24hours " +
      "                  lastMessage " +
      "           from whatsAppInteraction " +
      "           where botId = " + whatsAppInteraction.botId +
      "                 and userPhone = '" + whatsAppInteraction.userPhone + "'" +
      "                 and botPhone = '" + whatsAppInteraction.botPhone + "'" +
      "                 and lastMessage >= '" + util.dateToString(util.dateAddMinute(new Date(), -inbotConfig.timeOutSession24hours), "yyyy-MM-dd hh:mm:ss") + "'";

    await inbotDB.crud(script).then(function (resp) {
      if (resp !== undefined) {
        if (resp[0].session_id_24hours === 1) {
          console.log("Retornou algo 2")
          senderReturn = resp;
        }
      }
    });
  }
  if (senderReturn.length > 0) {
    whatsAppInteraction.escalation = senderReturn[0].escalation[0];
    whatsAppInteraction.id = senderReturn[0].id;
    whatsAppInteraction.sessionId = senderReturn[0].sessionId
    script = "update whatsAppInteraction set lastMessage = '" + whatsAppInteraction.lastMessage + "' where id = " + whatsAppInteraction.id;
    inbotDB.crud(script);

    return whatsAppInteraction;
  }

  const sessionId = await utils.sessionGenerator(25);
  script = "insert whatsAppInteraction (botPhone, userPhone, botId, sessionId, escalation, lastMessage, dateAdd) " +
    " values ('" + whatsAppInteraction.botPhone + "', '" +
    whatsAppInteraction.userPhone + "', " +
    whatsAppInteraction.botId + ", '" +
    sessionId + "', " +
    whatsAppInteraction.escalation + ", '" +
    whatsAppInteraction.lastMessage + "', '" +
    whatsAppInteraction.lastMessage + "'); "

  await inbotDB.crud(script);
  // Pegando o id da inclusão
  script = "select id, sessionId from whatsAppInteraction where userPhone = '" + whatsAppInteraction.userPhone + "' and botPhone = '" + whatsAppInteraction.botPhone + "' ORDER BY id DESC LIMIT 1";

  await inbotDB.crud(script).then(function (resp) {
    whatsAppInteraction.id = resp[0].id;
    whatsAppInteraction.sessionId = resp[0].sessionId;
  });

  return whatsAppInteraction;
};
const create24hours = async function (whatsAppInteraction) {
  let senderReturn;
  let script = "select id, " +
    "                  sessionId, " +
    "                  escalation " +
    "           from whatsAppInteraction " +
    "           where botId = " + whatsAppInteraction.botId +
    "                 and userPhone = '" + whatsAppInteraction.userPhone + "'" +
    "                 and botPhone = '" + whatsAppInteraction.botPhone + "'" +
    "                 and lastMessage >= '" + util.dateToString(util.dateAddDays(new Date(), -inbotConfig.timeOutSession24hours), "yyyy-MM-dd hh:mm:ss") + "'" +
    "                 and sendFeedback='true';";
  await inbotDB.crud(script).then(function (resp) {
    senderReturn = resp;
  });
  if (senderReturn.length > 0) {
    whatsAppInteraction.escalation = senderReturn[0].escalation[0];
    whatsAppInteraction.id = senderReturn[0].id;
    whatsAppInteraction.sessionId = senderReturn[0].sessionId
    script = "update whatsAppInteraction set lastMessage = '" + whatsAppInteraction.lastMessage + "' where id = " + whatsAppInteraction.id;
    inbotDB.crud(script);

    return whatsAppInteraction;
  }
  const sessionId = await utils.sessionGenerator(25);
  script = "insert whatsAppInteraction (botPhone, userPhone, botId, sessionId, escalation, lastMessage, dateAdd, session_id_24hours) " +
    " values ('" + whatsAppInteraction.botPhone + "', '" +
    whatsAppInteraction.userPhone + "', " +
    whatsAppInteraction.botId + ", " +
    "'" + sessionId + "', " +
    whatsAppInteraction.escalation + ", '" +
    whatsAppInteraction.lastMessage + "', '" +
    whatsAppInteraction.lastMessage + "', " +
    1 + "); "

  await inbotDB.crud(script);
  // Pegando o id da inclusão
  script = "select max(id) id, sessionId from whatsAppInteraction where userPhone = '" + whatsAppInteraction.userPhone + "' and botPhone = '" + whatsAppInteraction.botPhone + "'";
  console.log(script)
  await inbotDB.crud(script).then(function (resp) {
    whatsAppInteraction.id = resp[0].id;
    whatsAppInteraction.sessionId = resp[0].sessionId;
  });
  console.log(whatsAppInteraction)
  return whatsAppInteraction;
}
const complement = async function (whatsAppInteraction) {
  script = "update whatsAppInteraction set escalation = " + whatsAppInteraction.escalation +
    "       where id = " + whatsAppInteraction.id;
  inbotDB.crud(script);
  sanitize();
}

const getBySessionId = async function (sessionId) {

  whatsAppInteraction = {
    sessionId: sessionId
  };
  let lastMessage = util.dateToString(util.dateAddMinute(new Date(), -inbotConfig.timeOutSession), "yyyy-MM-dd hh:mm:ss");

  // Pega infos
  let script = "select id, " +
    "                  botPhone, " +
    "                  userPhone, " +
    "                  botId, " +
    "                  sessionId, " +
    "                  escalation " +
    "           from whatsAppInteraction " +
    "           where sessionId = '" + sessionId + "'" +
    "                 and lastMessage >= '" + lastMessage + "'";
  let senderReturn;
  await inbotDB.crud(script).then(function (resp) {
    senderReturn = resp;
  });

  if (senderReturn.length == 0)
    throw new Exception("SessionId não encontrada no banco");

  whatsAppInteraction.id = senderReturn[0].id;
  whatsAppInteraction.botPhone = senderReturn[0].botPhone;
  whatsAppInteraction.userPhone = senderReturn[0].userPhone;
  whatsAppInteraction.botId = senderReturn[0].botId;
  whatsAppInteraction.escalation = +(senderReturn[0].escalation == "true");

  script = "update whatsAppInteraction set lastMessage = '" + util.dateToString(new Date(), "yyyy-MM-dd hh:mm:ss") + "' where id = " + whatsAppInteraction.id;
  inbotDB.crud(script);

  return whatsAppInteraction;
};

const getByPhone = async function (userPhone, botPhone) {

  whatsAppInteraction = {
    botPhone: botPhone,
    userPhone: userPhone
  };
  let lastMessage = util.dateToString(util.dateAddMinute(new Date(), -inbotConfig.timeOutSession), "yyyy-MM-dd hh:mm:ss");

  // Pega infos
  let script = "select id,        \
                       botPhone,  \
                       userPhone, \
                       botId,     \
                       sessionId, \
                       escalation \
                from whatsAppInteraction \
                where botPhone = '" + botPhone + "'       \
                      and userPhone = '" + userPhone + "' \
                      and lastMessage >= '" + lastMessage + "'";
  let senderReturn;
  await inbotDB.crud(script).then(function (resp) {
    senderReturn = resp;
  });

  if (senderReturn === undefined) {
    let script = "select id,        \
    botPhone,  \
    userPhone, \
    botId,     \
    sessionId, \
    escalation \
from whatsAppInteraction \
where botPhone = '" + botPhone + "'       \
   and userPhone = '" + userPhone + "'";
    await inbotDB.crud(script).then(function (resp) {
      senderReturn = resp;
    });

    const sessionId = await utils.sessionGenerator(25);
    const newTimeSession = new Date();
    script = "insert whatsAppInteraction (botPhone, userPhone, botId, sessionId, escalation, lastMessage, dateAdd, session_id_24hours) " +
      " values ('" + botPhone + "', '" +
      userPhone + "', " +
      senderReturn[0].botId + ", " +
      "'" + sessionId + "', " +
      senderReturn[0].escalation + ", '" +
      newTimeSession + "', '" +
      newTimeSession + "', " +
      0 + "); "

    await inbotDB.crud(script);
  }

  script = "select id,        \
  botPhone,  \
  userPhone, \
  botId,     \
  sessionId, \
  escalation \
from whatsAppInteraction \
where botPhone = '" + botPhone + "'       \
 and userPhone = '" + userPhone + "' \
 and lastMessage >= '" + lastMessage + "'";
  senderReturn;
  await inbotDB.crud(script).then(function (resp) {
    senderReturn = resp;
  });
  if (senderReturn.length > 0) {
    whatsAppInteraction.sessionId = senderReturn[0]?.sessionId;
    whatsAppInteraction.id = senderReturn[0]?.id;
    whatsAppInteraction.botId = senderReturn[0]?.botId;
    whatsAppInteraction.escalation = +(senderReturn[0]?.escalation == "true");
  }
  script = "update whatsAppInteraction set lastMessage = '" + util.dateToString(new Date(), "yyyy-MM-dd hh:mm:ss") + "' where id = " + whatsAppInteraction.id;
  inbotDB.crud(script);

  return whatsAppInteraction;
};

const sanitize = function () {
  // Só mantém no bd os registros dos últimos 2 dias
  let dateDelete = util.dateAddDays(new Date(), -2);
  let script = "delete from whatsAppInteraction where dateAdd <= '" + util.dateToString(dateDelete, 'yyyy-MM-dd') + "'";
  inbotDB.crud(script);
};

const getSTT = async function (whatsAppInteraction) {
  console.log('teste->', whatsAppInteraction);
}

const blackListCheck = async function (number) {
  // Pega infos
  let blackNumber = "select id,     \
                            name,   \
                            number  \
                     from blackList \
                     where number = '" + number + "'";
  let senderReturn = {};
  await inbotDB.crud(blackNumber).then(function (resp) {
    senderReturn = resp;
  });
  return senderReturn;
}

module.exports = {
  check,
  complement,
  getBySessionId,
  getByPhone,
  getSTT,
  blackListCheck,
  create24hours
};