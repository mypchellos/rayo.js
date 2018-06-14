const pino = require('pino');

module.exports = pino({
  name: process.env.RAYO_LOG_NAME || 'Rayo',
  level: process.env.RAYO_LOG_LEVEL || 'info',
  prettyPrint: process.env.RAYO_LOG_PRETTY
});
