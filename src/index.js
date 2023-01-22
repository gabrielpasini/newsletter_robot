require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();

const formatEmail = require('./robots/format-email.js');
const saveEmail = require('./robots/save-email.js');
const createAudio = require('./robots/synthesize-audio.js');
const createVideo = require('./robots/render-video.js');
const createThumbnail = require('./robots/draw-thumbnail.js');
const uploadContent = require('./robots/upload-youtube.js');

const EmailModel = require('./models/email.js');

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

async function startWebServer() {
  return await new Promise((resolve, reject) => {
    app.listen(process.env.PORT, () => {
      console.log(`> [server] Rodando servidor em ${process.env.BASE_URI}`);
      resolve();
    });
  });
}

function connectToDatabase() {
  try {
    mongoose.connect(process.env.MONGO_DB);
    console.log('> [database] Conectado ao banco de dados');
  } catch (err) {
    console.log('> [database] Erro ao se conectar ao banco de dados: ' + err);
  }
}

async function execute() {
  await startWebServer();
  connectToDatabase();
}

app.post('/start', async (req, res) => {
  try {
    console.log('> [server] Iniciando criacao de conteudo...');
    const email = req.body;
    const emailFormated = formatEmail(email);
    const newEmail = await saveEmail(emailFormated);
    if (!newEmail) return res.status(400).send('Este e-mail ja foi utilizado');
    await createAudio();
    await createVideo();
    await createThumbnail();
    // const videoId = await uploadContent();
    // console.log(`> [server] Video disponível em: https://youtu.be/${videoId}`);
    return res.status(200).send({ emailFormated });
  } catch (err) {
    return res.status(400).send({ error: err });
  }
});

app.get('/', async (req, res) => {
  try {
    const { id } = req.query;
    if (id) {
      const savedEmail = await EmailModel.findOne({ id });
      if (savedEmail)
        return res.send(
          `<head><title>Notícias de tecnologia</title></head><h1>${
            savedEmail.subject
          }</h1><h2><pre>${
            savedEmail.content.split('Cancelar inscrição (')[0]
          }</pre><h2>`
        );
      return res.send(
        `<head><title>Notícias de tecnologia</title></head><h1>Notícias de tecnologia - Deschamps Newsletter</h1><h2>Notícia não encontrada, insira um ID válido!<h2>`
      );
    } else {
      return res.send(
        `<head><title>Notícias de tecnologia</title></head><h1>Notícias de tecnologia - Deschamps Newsletter</h1><h2>Adicione um ID válido na URL para buscar pela notícia!<h2>`
      );
    }
  } catch (err) {
    return res.status(400).send({ error: err });
  }
});

execute();
