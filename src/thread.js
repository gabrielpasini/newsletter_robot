const google = require('googleapis').google;
const OAuth2 = google.auth.OAuth2;

const app = require('./app.js');
const { authWebhook, errorLog } = require('./webhooks.js');
const synthesizeAudio = require('./robots/synthesize-audio.js');
const renderVideo = require('./robots/render-video.js');
const drawThumbnail = require('./robots/draw-thumbnail.js');
const uploadContent = require('./robots/upload-content.js');

let authCode = '';
let OAuthClient = '';
let youtubeAuthenticatedClient = null;

async function requestGoogleForAccessTokens() {
  return await new Promise(async (resolve, reject) => {
    await OAuthClient.getToken(authCode, async (error, tokens) => {
      if (error) errorLog('> [auth-robot] Erro ao pegar o token: ' + error);
      await OAuthClient.setCredentials(tokens);
      resolve();
    });
  });
}

function setGlobalGoogleAuthentication() {
  google.options({
    auth: OAuthClient,
  });
  return google;
}

async function createOAuthClient() {
  return await new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    `${process.env.BASE_URI}/oauth2callback`
  );
}

async function requestUserConsent(client) {
  const consentUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload',
    ],
  });
  console.log(`> [auth-robot] Abrindo a tela de consentimento: ${consentUrl}`);
  await authWebhook(consentUrl);
}

function waitForAuthenticationCompleted() {
  return new Promise(async (resolve, reject) => {
    const refreshIntervalId = setInterval(() => {
      console.log('> [auth-robot] Aguardando o consentimento do usuário...');
      if (youtubeAuthenticatedClient) {
        clearInterval(refreshIntervalId);
        resolve();
      }
    }, 1000);
  });
}

async function authUser() {
  console.log('> [auth-robot] Autenticando...');
  OAuthClient = await createOAuthClient();
  await requestUserConsent(OAuthClient);
  await waitForAuthenticationCompleted();
}

async function thread() {
  try {
    console.log('> [thread] Iniciando thread de geracao dos arquivos...');
    await synthesizeAudio();
    await renderVideo();
    await drawThumbnail();
    await authUser();
    const videoId = await uploadContent(youtubeAuthenticatedClient);
    console.log(
      `> [thread] Finalizado! Video disponível em: https://youtu.be/${videoId}`
    );
  } catch (err) {
    errorLog(`> [thread] Erro na thread: ${err}`);
  }
}

app.get('/oauth2callback', async (req, res) => {
  authCode = req.query.code;
  console.log(`> [auth-robot] Código de autenticação: ${authCode}`);
  await requestGoogleForAccessTokens();
  const googleAuthenticatedClient = await setGlobalGoogleAuthentication();
  youtubeAuthenticatedClient = googleAuthenticatedClient.youtube({
    version: 'v3',
  });

  res.send('Usuario autenticado');
});

module.exports = thread;
