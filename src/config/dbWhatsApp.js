const mysql = require('mysql2');

let pool;

function handleDisconnect() {
  pool = mysql.createPool({
    host:'localhost',// process.env.DB_HOST_WHATS,
    user: process.env.DB_USER_WHATS,
    password: process.env.DB_PASS_WHATS,
    database: process.env.DB_NAME_WHATS,
    port: process.env.DB_PORT_WHATS
  });

  pool.getConnection(function (err, connection) {
    if (err) {
      console.error('Erro ao conectar ao banco de dados:', err);
      setTimeout(handleDisconnect, 2000); // Tente reconectar após 2 segundos
    } else {
      console.log('Conexão com o banco de dados whatsapp estabelecida');
      connection.release();
    }
  });

  pool.on('error', function (err) {
    console.error('Erro de banco de dados whats:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect(); // Reconecte se a conexão for perdida
    } else {
      throw err;
    }
  });
}

handleDisconnect();

module.exports = pool;
