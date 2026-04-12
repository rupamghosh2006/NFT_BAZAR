const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const config = require('../configs');

morgan.token('request-id', (req) => req.requestId);
morgan.token('response-time-pretty', (req, res) => {
  if (res._startAt) {
    const ms = (res._startTime - req._startTime) * 1000;
    return `${ms.toFixed(2)}ms`;
  }
});

const format = config.nodeEnv === 'production'
  ? ':request-id :method :url :status :response-time-pretty :res[content-length]'
  : 'dev';

function requestIdMiddleware(req, res, next) {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
}

const logger = morgan(format);

module.exports = { requestIdMiddleware, logger };
