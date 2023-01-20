require('dotenv').config();
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const app = express();

const Email = require('./models/email.js');

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
      throw err;
    }
  });

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
  console.log('> [format-email] Descricao criada');
  return desc;
};

const formatEmail = (objEmail) => {
  try {
    if (objEmail) {
      let text = objEmail?.content?.includes('Filipe Deschamps Newsletter')
        ? objEmail?.content?.split('Filipe Deschamps Newsletter')[1]
        : objEmail?.content;
      text = text.split('Cancelar inscrição (')[0];
      text = text.replace(/(\n\n)/gm, '#####');
      text = text.replace(/(\n)/gm, ' ');
      text = text.replace(/(#####)/gm, '\r\n');
      const links = text.match(/\bhttps?:\/\/\S+/gi);
      const description = makeDescription(links);
      const tags = objEmail?.subject?.split(' / ');
      //remove urls
      text = text.replace(
        /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/g,
        ''
      );
      //substitui "Link Patrocinado/Afiliado" por "Link na descrição"
      text = text.replace('Link Patrocinado (  )', 'Link na descrição!');
      text = text.replace('Link Afiliado (  )', 'Link na descrição!');
      //adiciona finalização
      text =
        text +
        'Este robô foi desenvolvido por Gabriel Pasini!\r\nDeixe o like e se inscreva! Até a próxima!';
      objEmail.content = text;
      objEmail.description = description;
      objEmail.tags = tags;
      console.log('> [format-email] Conteudo formatado com sucesso');
      return objEmail;
    }
  } catch (err) {
    console.log('> [format-email] Erro ao formatar o conteudo');
    throw err;
  }
};

app.post('/format-email', async (req, res) => {
  try {
    console.log('> [format-email] Iniciando tratamento do e-mail...');
    const email = req.body;
    await saveEmail(email);
    const emailFormated = formatEmail(email);
    const jsonFile = JSON.stringify(emailFormated, null, 2);
    fs.writeFileSync('text.json', jsonFile);
    console.log('> [format-email] Conteudo do e-mail salvo com sucesso');
    res.status(200).send({ emailFormated });
  } catch (err) {
    res.status(400).send({ error: err });
  }
});

start();
