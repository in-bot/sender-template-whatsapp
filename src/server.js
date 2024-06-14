require("dotenv").config({ path: ".env" });
const redis = require("./services/redis")

// Em localhost o REDIS nao funciona, entao necessario comentar linha abaixo
redis.processQueue('whatsapp');