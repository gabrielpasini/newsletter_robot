require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const google = require('googleapis').google;
const youtube = google.youtube({ version: 'v3' });
const OAuth2 = google.auth.OAuth2;
const app = express();

const Email = require('../models/email.js');
const Content = require('../../text.json');

let authCode = '';
let OAuthClient = '';
let validTokens = null;
let email = {};
let redirectRoute = '/';

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

const buildHeaders = (tokens) => ({
  Authorization: `${tokens.token_type} ${tokens.access_token}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
});

const getMessageIds = async (headers) => {
  const response = await axios({
    method: 'get',
    url: `https://gmail.googleapis.com/gmail/v1/users/${process.env.USER_ID}/messages?q=from:${process.env.SENDER_ID}`,
    headers,
  });
  if (response.data.messages && response.data.messages.length) {
    console.log(
      `> [gmail-robot] ${response.data.messages.length} mensagens de ${process.env.SENDER_ID} encontradas!`
    );
    return response.data.messages.map((msg) => msg.id);
  } else {
    console.log(`> [gmail-robot] Nenhuma mensagem encontrada!`);
    return null;
  }
};

const getBodyMessages = async (ids, headers) => {
  const response = await axios({
    method: 'get',
    url: `https://gmail.googleapis.com/gmail/v1/users/${process.env.USER_ID}/messages/${ids[0]}`,
    headers,
  });
  const content = Buffer.from(
    response.data.payload.parts[0].body.data,
    'base64'
  ).toString('utf8');
  console.log('> [gmail-robot] Conteúdo do e-mail decodificado!');
  return {
    id: response.data.id,
    assunto: response.data.payload.headers.find(
      (header) => header.name === 'Subject'
    ).value,
    conteudo: content,
  };
};

const saveEmail = (email) =>
  new Promise(async (resolve, reject) => {
    try {
      const savedEmail = await Email.findOne({ id: email.id });
      if (savedEmail) {
        console.log(
          '> [gmail-robot] Este e-mail já está salvo! Tente novamente mais tarde...'
        );
      } else {
        await Email.create(email);
        console.log('> [gmail-robot] Novo e-mail salvo no banco de dados!');
      }
      return resolve(email);
    } catch (err) {
      console.log(
        '> [gmail-robot] Erro ao salvar/atualizar o email no banco de dados: ' +
          err
      );
    }
  });

const createOAuthClient = async () =>
  new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    `${process.env.BASE_URI}/oauth2callback`
  );

const requestUserConsent = async (client, response) => {
  const consentUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://mail.google.com/',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/youtubepartner',
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.download',
      'https://www.googleapis.com/auth/youtube.upload',
    ],
  });
  console.log(`> [auth-robot] Abrindo a tela de consentimento...`);
  await response.redirect(consentUrl);
};

const waitForGoogleCallback = () =>
  new Promise(async (resolve, reject) => {
    const refreshIntervalId = setInterval(() => {
      console.log('> [auth-robot] Aguardando o consentimento do usuário...');
      if (authCode) {
        clearInterval(refreshIntervalId);
        resolve();
      }
    }, 1000);
  });

const requestGoogleForAccessTokens = async () =>
  new Promise(async (resolve, reject) => {
    await OAuthClient.getToken(authCode, async (error, tokens) => {
      if (error) console.log('> [auth-robot] Erro ao pegar o token: ' + error);
      await OAuthClient.setCredentials(tokens);
      resolve(tokens);
    });
  });

const setGlobalGoogleAuthentication = () =>
  google.options({
    auth: OAuthClient,
  });

const gmailRobot = async (tokens) => {
  console.log('> [gmail-robot] Iniciando robô do gmail...');
  const headers = buildHeaders(tokens);
  const messageIds = await getMessageIds(headers);
  if (messageIds) {
    email = await getBodyMessages(messageIds, headers);
    await saveEmail(email);
  } else {
    email = null;
  }
};

const startRobot = async (response) => {
  authCode = '';
  OAuthClient = '';
  validTokens = '';
  email = '';
  console.log('> [auth-robot] Autenticando...');
  OAuthClient = await createOAuthClient();
  await requestUserConsent(OAuthClient, response);
  await waitForGoogleCallback();
  return;
};

const startWebServer = async () =>
  new Promise((resolve, reject) => {
    app.listen(process.env.PORT, () => {
      console.log(`> [server] Rodando servidor em ${process.env.BASE_URI}`);
      resolve();
    });
  });

const connectToDatabase = async () => {
  try {
    mongoose.connect(process.env.MONGO_DB);
    console.log('> [database] Conectado ao banco de dados!');
  } catch (err) {
    console.log('> [database] Erro ao se conectar ao banco de dados: ' + err);
  }
};

const start = async () => {
  await startWebServer();
  await connectToDatabase();
};

const makeDescription = (links) => {
  let linkString = '';
  links.map((link) => (linkString = linkString + link + '\r\n'));
  const desc = `ASSINE A NEWSLETTER GRATUITAMENTE PELO LINK: https://filipedeschamps.com.br/newsletter\r\n\r\n${
    links.length > 0 ? `Links citados no vídeo:\r\n${linkString}` : ''
  }\r\nESTE ROBÔ FOI CRIADO COM O INTUITO DE TESTAR AS TECNOLOGIAS, PROMOVER A NEWSLETTER E DISSEMINAR ESSSAS INFORMAÇÕES FILTRADAS E CONFIÁVEIS DISPONIBILIZADAS NELA GRATUITAMENTE.\r\n\r\nDesenvolvido por Gabriel Pasini: https://pasini.dev`;
  return desc;
};

const formatEmail = (objEmail) => {
  if (objEmail) {
    let text = objEmail.conteudo.split(
      'Filipe Deschamps Newsletter\r\n\r\n'
    )[1];
    text = text.split('Cancelar inscrição (')[0];
    const links = text.match(/\bhttps?:\/\/\S+/gi);
    const description = makeDescription(links);
    const tags = objEmail.assunto.split(' / ');
    //remove urls
    text = text.replace(
      /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/g,
      ''
    );
    //substitui "Link Patrocinado/Afiliado" por "Link na descrição"
    text = text.replace('Link Patrocinado (\r\n\r\n)', 'Link na descrição!');
    text = text.replace('Link Afiliado (\r\n\r\n)', 'Link na descrição!');
    //adiciona finalização
    text =
      text +
      'Este robô foi desenvolvido por Gabriel Pasini!\r\nDeixe o like e se inscreva! Até a próxima!';
    objEmail.conteudo = text;
    objEmail.description = description;
    objEmail.tags = tags;
    return objEmail;
  }
};

const uploadVideo = async () => {
  const videoFilePath = path.join(__dirname, '../output.mp4');
  const videoFileSize = fs.statSync(videoFilePath).size;
  const videoTitle = Content.assunto;
  const videoTags = Content.tags;
  const videoDescription = Content.description.toString();
  const requestParameters = {
    part: 'snippet, status',
    requestBody: {
      snippet: {
        title: videoTitle,
        description: videoDescription,
        tags: videoTags,
      },
      status: {
        privacyStatus: 'unlisted',
      },
    },
    media: {
      body: fs.createReadStream(videoFilePath),
    },
  };
  console.log('> [youtube-robot] Iniciando upload do vídeo para o YouTube...');
  const onUploadProgress = (event) => {
    const progress = Math.round((event.bytesRead / videoFileSize) * 100);
    console.log(`> [youtube-robot] ${progress}% completo...`);
  };
  const youtubeResponse = await youtube.videos.insert(requestParameters, {
    onUploadProgress: onUploadProgress,
  });
  console.log(
    `> [youtube-robot] Video disponível em: https://youtu.be/${youtubeResponse.data.id}`
  );
  return youtubeResponse.data;
};

const uploadThumbnail = async (videoInformation) => {
  const videoId = videoInformation.id;
  const videoThumbnailFilePath = path.join(__dirname, '../thumbnail.jpg');
  const requestParameters = {
    videoId: videoId,
    media: {
      mimeType: 'image/jpeg',
      body: fs.createReadStream(videoThumbnailFilePath),
    },
  };
  await youtube.thumbnails.set(requestParameters);
  console.log(`> [youtube-robot] Thumbnail carregada!`);
};

app.get('/send-video', async (req, res) => {
  const videoInformation = await uploadVideo();
  await uploadThumbnail(videoInformation);
  res.send(
    `<p><a href="${process.env.BASE_URI}/">Início</a></p><br /><p><a href="https://youtu.be/${videoInformation.id}/">VÍDEO POSTADO!</a></p>`
  );
});

app.get('/show-email', async (req, res) => {
  await gmailRobot(validTokens);
  const emailFormated = formatEmail(email);
  const jsonFile = JSON.stringify(emailFormated, null, 2);
  fs.writeFileSync('text.json', jsonFile);
  res.send(
    `<p><a href="${process.env.BASE_URI}/">Início</a></p><br />${JSON.stringify(
      emailFormated
    )}`
  );
});

app.get('/oauth2callback', async (req, res) => {
  authCode = req.query.code;
  console.log(`> [auth-robot] Código de autenticação: ${authCode}`);
  validTokens = await requestGoogleForAccessTokens();
  await setGlobalGoogleAuthentication();
  res.redirect(redirectRoute);
});

app.get('/', async (req, res) =>
  res.send(
    `<h1>ROBÔ INICIADO!</h1><p>Clique <a href="${process.env.BASE_URI}/gmail">aqui</a> para buscar por novos e-mails de ${process.env.SENDER_ID}</p><p>Clique <a href="${process.env.BASE_URI}/upload">aqui</a> para fazer upload do vídeo no Youtube.</p>`
  )
);

app.get('/gmail', async (req, res) => {
  redirectRoute = '/show-email';
  await startRobot(res);
});

app.get('/upload', async (req, res) => {
  redirectRoute = '/send-video';
  await startRobot(res);
});

app.get('/all-emails', async (req, res) => {
  const allEmails = await Email.find();
  res.send(allEmails);
});

start();
