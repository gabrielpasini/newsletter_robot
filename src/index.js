require('dotenv').config();
const mongoose = require('mongoose');

const app = require('./app.js');
const thread = require('./thread.js');
const { errorLog } = require('./webhooks.js');

const formatEmail = require('./robots/format-email.js');
const saveEmail = require('./robots/save-email.js');

const EmailModel = require('./models/email.js');

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
    const email = req.body;
    const emailFormated = formatEmail(email);
    const newEmail = await saveEmail(emailFormated);
    if (!newEmail) return res.status(400).send('Este e-mail ja foi utilizado');
    thread();
    console.log(
      '> [server] Gerando o conteudo de audio, video, thumbnail, realizando o upload para o youtube e em breve estara disponivel...'
    );
    return res
      .status(200)
      .send(
        `Gerando o conteudo de audio, video, thumbnail, realizando o upload para o youtube e em breve estara disponivel...`
      );
  } catch (err) {
    return res.status(400).send({ error: err });
  }
});

app.get('/retry', async (req, res) => {
  try {
    console.log(
      '> [server] Reiniciando criacao de conteudo a partir do ultimo e-mail salvo...'
    );
    thread();
    console.log(
      '> [server] Gerando o conteudo de audio, video, thumbnail, realizando o upload para o youtube e em breve estara disponivel...'
    );
    return res
      .status(200)
      .send(
        `Gerando o conteudo de audio, video, thumbnail, realizando o upload para o youtube e em breve estara disponivel...`
      );
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
