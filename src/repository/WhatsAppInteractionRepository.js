const db = require("../config/dbWhatsApp")

module.exports = {
    getByBotPhoneBotIdUserPhone: (botId, userPhone, botPhone) => {
        return new Promise((accept, reject) => {
            db.query(
                "SELECT id, sessionId, escalation, session_id_24hours, lastMessage from whatsAppInteraction where botId = ? and userPhone = ? and botPhone = ? ORDER BY id DESC LIMIT 1;",
                [botId, userPhone, botPhone],
                (error, results) => {
                    if (error) {
                        return reject("Request getAllNumbers error: ", error);
                    }
                    accept(results);
                }
            );
        });
    },
    createNewSession: (botPhone, userPhone, botId, sessionId, escalation, lastMessage, messageWhatsAppID) => {
        return new Promise((accept, reject) => {
            db.query(
                "INSERT whatsAppInteraction (botPhone, userPhone, botId, sessionId, escalation, lastMessage, dateAdd, whatsappMsgId) VALUES (?,?,?,?,?,?,?,?);",
                [botPhone, userPhone, botId, sessionId, escalation, lastMessage, lastMessage, messageWhatsAppID],
                (error, results) => {
                    if (error) {
                        return reject("Request createNewSession error: ", error);
                    }
                    accept(results);
                }
            );
        });
    },
    getMessageWhatsAppId: (messageID) => {
        return new Promise((accept, reject) => {
            db.query(
                "SELECT id FROM whatsAppInteraction where whatsappMsgId = ?;", [messageID],
                (error, results) => {
                    if (error) {
                        return reject("Request getMessageWhatsAppId error: ", error);
                    }
                    accept(results);
                }
            );
        });
    },
    updateCustomer: (botId,userPhone,botPhone,lastMessage,messageWhatsAppId, sessionId) => {
        return new Promise((accept, reject) => {
            db.query(
                "UPDATE whatsAppInteraction SET lastMessage=? , whatsappMsgId=? where botId=? AND userPhone=? AND botPhone=? AND sessionId=?;", [lastMessage,messageWhatsAppId,botId,userPhone,botPhone,sessionId],
                (error, results) => {
                    if (error) {
                        return reject("Request getMessageWhatsAppId error: ", error);
                    }
                    accept(results);
                }
            );
        });
    },
    changeEscalationCustomerBySessionId: (escalation,sessionId) => {
        return new Promise((accept, reject) => {
            db.query(
                "UPDATE whatsAppInteraction SET escalation=? where sessionId=?;", [escalation,sessionId],
                (error, results) => {
                    if (error) {
                        return reject("Request getMessageWhatsAppId error: ", error);
                    }
                    accept(results);
                }
            );
        });
    },
    changeEscalationCustomer: (botId,userPhone,botPhone,lastMessage,messageWhatsAppId, sessionId, escalation) => {
        return new Promise((accept, reject) => {
            db.query(
                "UPDATE whatsAppInteraction SET lastMessage=? , whatsappMsgId=?, escalation=? where botId=? AND userPhone=? AND botPhone=? AND sessionId=?;", [lastMessage,messageWhatsAppId,escalation,botId,userPhone,botPhone,sessionId],
                (error, results) => {
                    if (error) {
                        return reject("Request getMessageWhatsAppId error: ", error);
                    }
                    accept(results);
                }
            );
        });
    },
}