const mysql = require('mysql2');
const config = require("config");
const util = require("./util");
const dbDataConnect = {
    host: process.env.DB_HOST_WHATS,
    user: process.env.DB_USER_WHATS,
    password: process.env.DB_PASS_WHATS,
    database: process.env.DB_NAME_WHATS,
    port: process.env.DB_PORT_WHATS
}
var pool = mysql.createPool(dbDataConnect);

pool.on('error', error => logFail("connection error", error, true));

async function crud(sql) {
  let result;

  await execute(sql).then(returnExecution => result = returnExecution).catch(err => console.error(err));

  return result;
};

function execute(sql) {
  return new Promise((resolve, reject) => {
    pool.getConnection((errorConnect, connection) => {
      if (errorConnect) {
        logFail("error to get connection", errorConnect, true);
        reject(errorConnect);
        return;
      }

      connection.query(sql, (error, result, fields) => {
        if (error) {
          logFail("crud", error, false);
          reject(error);
          return;
        } else if (result.info == undefined) {
          let jsonReturn = result.map(row => Object.assign({}, row));
          resolve(jsonReturn);
        } else
          resolve({});

        connection.release();
      });

    })

  })
  .catch(error => {
    console.error('Erro na execução:', error);
    throw error;
  });
}

function logFail(message, error, kill) {
  logAction.function = "error to get connection";
  logAction.message = error;
  logger.log(logAction);

  if (kill)
    util.killContainer();
}

module.exports = {
  crud
};