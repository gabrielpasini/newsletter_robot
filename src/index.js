require('dotenv').config();
const mongoose = require('mongoose');
const https = require('https');
const fs = require('fs');

const app = require('./app.js');
const thread = require('./thread.js');
const { errorLog } = require('./webhooks.js');

const EmailModel = require('./models/email.js');

async function startWebServer() {
  return await new Promise((resolve, reject) => {
    https
      .createServer(
        {
          key: fs.readFileSync('key.pem'),
          cert: fs.readFileSync('cert.pem'),
        },
        app
      )
      .listen(process.env.PORT, () => {
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
    console.error('> [database] Erro ao se conectar ao banco de dados: ' + err);
    errorLog('> [database] Erro ao se conectar ao banco de dados: ' + err);
  }
}

async function execute() {
  await startWebServer();
  connectToDatabase();
}

app.get('/start', async (req, res) => {
  try {
    console.log('> [server] Iniciando criacao de conteudo...');
    thread(req.route.path);
    return res.status(200).send(`Iniciando criacao de conteudo...`);
  } catch (err) {
    return res.status(400).send({ error: err });
  }
});

app.get('/retry', async (req, res) => {
  try {
    console.log(
      '> [server] Reiniciando criacao de conteudo a partir do ultimo e-mail salvo...'
    );
    thread(req.route.path);
    return res
      .status(200)
      .send(
        `Reiniciando criacao de conteudo a partir do ultimo e-mail salvo...`
      );
  } catch (err) {
    return res.status(400).send({ error: err });
  }
});

app.get('/', async (req, res) => {
  try {
    const { id } = req.query;
    const savedEmail = id
      ? await EmailModel.findOne({ id })
      : await EmailModel.findOne();
    if (!id) {
      return res.redirect(`?id=${savedEmail?.id}`);
    }
    if (savedEmail) {
      return res.send(
        `<head><title>Notícias de tecnologia</title></head><iframe src="https://www.youtube.com/embed/${savedEmail?.videoId}" width="640" height="360" frameborder="0"></iframe><h1>${savedEmail?.subject}</h1><h2><pre>${savedEmail?.formattedContent}</pre></h2>`
      );
    } else if (!savedEmail && id) {
      return res.send(
        `<head><title>Notícias de tecnologia</title></head><h1>Notícias de tecnologia</h1><h2>Notícia não encontrada, insira um ID válido ou tente novamente mais tarde...<h2>`
      );
    }
  } catch (err) {
    console.error(err);
    return res.status(400).send(err);
  }
});

execute();
