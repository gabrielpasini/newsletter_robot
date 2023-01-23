const axios = require('axios');

async function authWebhook(content) {
  return await axios.post(
    'https://discord.com/api/webhooks/1066973454936588328/rT87xaG195goHzJ62ae_Qk_VreJEjD92UhNqTYy3Zrm3TZmP5cCf38rxVLyXulaPXMKe',
    { content }
  );
}

async function errorLog(content) {
  return await axios.post(
    'https://discord.com/api/webhooks/1066977872914415627/8oGRFuEsW6kwLZBljDKSMN7MoA526cKAEC6rY1DJ1eegsgzBFCnHxd8Za8JLOJOX0pzl',
    { content }
  );
}

module.exports = { authWebhook, errorLog };