const axios = require('axios');

async function authWebhook(content) {
  return await axios.post(process.env.WEBHOOK_AUTH, { content });
}

async function errorLog(content) {
  return await axios.post(process.env.WEBHOOK_ERROR, {
    content: '```' + content + '```',
  });
}

async function successMessage(content) {
  return await axios.post(process.env.WEBHOOK_SUCCESS, { content });
}

module.exports = { authWebhook, errorLog, successMessage };
