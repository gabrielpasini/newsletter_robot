const google = require('googleapis').google;
const OAuth2 = google.auth.OAuth2;

const app = require('./app.js');
const { authWebhook, errorLog, successMessage } = require('./webhooks.js');
const { getEmailFromGmail } = require('./robots/get-email.js');
const synthesizeAudio = require('./robots/synthesize-audio.js');
const renderVideo = require('./robots/render-video.js');
const drawThumbnail = require('./robots/draw-thumbnail.js');
const uploadContent = require('./robots/upload-content.js');
const formatEmail = require('./robots/format-email.js');
const { saveEmail, addVideoIdToEmail } = require('./robots/save-email.js');

let authCode = '';
let OAuthClient = '';
let route = '';
let youtubeAuthenticatedClient = null;
let validTokens = null;
let date = null;

async function requestGoogleForAccessTokens() {
  return await new Promise(async (resolve, reject) => {
    await OAuthClient.getToken(authCode, async (error, tokens) => {
      if (error) {
        console.error('> [auth-robot] Erro ao pegar o token: ' + error);
        errorLog('> [auth-robot] Erro ao pegar o token: ' + error);
      }
      await OAuthClient.setCredentials(tokens);
      resolve(tokens);
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
      'https://mail.google.com/',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload',
    ],
  });
  console.log(`> [auth-robot] Abrindo a tela de consentimento: ${consentUrl}`);
  await authWebhook(
    `***${date.toLocaleTimeString()}*** disponível em: ${consentUrl}`
  );
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

async function thread(newRoute) {
  route = newRoute;
  date = new Date();
  try {
    console.log('> [thread] Iniciando thread de geracao dos arquivos...');
    validTokens = '';
    await authUser();
  } catch (err) {
    console.error(`> [thread] Erro na thread: ${err}`);
    errorLog(`> [thread] Erro na thread: ${err}`);
  }
}

async function runRots() {
  try {
    console.log(
      `> [bots] Gerando o conteudo de audio, video, thumbnail, realizando o upload para o youtube e em breve estara disponivel...`
    );
    const email = await getEmailFromGmail(validTokens);
    const emailFormated = formatEmail(email);
    const isNewEmail = await saveEmail(emailFormated);
    if (!isNewEmail && route === '/start') {
      throw new Error('Este e-mail ja foi utilizado');
    }
    await synthesizeAudio();
    await renderVideo();
    await drawThumbnail();
    const videoId = await uploadContent(youtubeAuthenticatedClient);
    const fullDate = date.toLocaleDateString();
    successMessage(
      `Video do dia ***${fullDate}*** prontinho e disponível em: https://youtu.be/${videoId}`
    );
    console.log(
      `> [bots] Finalizado! Video do dia ${fullDate} prontinho e disponível em: https://youtu.be/${videoId}`
    );
    await addVideoIdToEmail(email.id, videoId);
  } catch (err) {
    console.error(`> [bots] Erro em algum robô: ${err}`);
    errorLog(`> [bots] Erro em algum robô: ${err}`);
  }
}

app.get('/oauth2callback', async (req, res) => {
  try {
    authCode = req.query.code;
    console.log(`> [auth-robot] Código de autenticação: ${authCode}`);
    validTokens = await requestGoogleForAccessTokens();
    const googleAuthenticatedClient = await setGlobalGoogleAuthentication();
    youtubeAuthenticatedClient = googleAuthenticatedClient.youtube({
      version: 'v3',
    });

    runRots();
    res.send('Usuario autenticado');
  } catch (err) {
    console.error(`> [auth-robot] Erro no robô de autenticação: ${err}`);
    errorLog(`> [auth-robot] Erro no robô de autenticação: ${err}`);
  }
});

module.exports = thread;
