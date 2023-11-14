const axios = require('axios');

const EmailModel = require('../models/email.js');

async function getRecentEmail() {
  return await new Promise(async (resolve, reject) => {
    try {
      const storedDBEmail = await EmailModel.findOne().sort('-createdAt');
      if (!storedDBEmail) return reject();
      console.log(
        '> [persistence-robot] Email mais recente carregado com sucesso'
      );
      return resolve(storedDBEmail);
    } catch (err) {
      console.error(
        '> [persistence-robot] Erro ao buscar o ultimo email: ' + err
      );
      errorLog(
        '> [persistence-robot] Erro ao salvar/atualizar o email: ' + err
      );
      return reject();
    }
  });
}

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
  const subject = response.data.payload.headers.find(
    (header) => header.name === 'Subject'
  ).value;
  const splittedSubject = subject.split(' / ');
  const largestText = Math.max(...splittedSubject.map((text) => text.length));
  const trunkatedSubject =
    subject.length >= 100
      ? splittedSubject
          .filter((text) => text.length !== largestText)
          .join(' / ')
      : subject;
  return {
    id: response.data.id,
    subject,
    trunkatedSubject,
    content: content,
  };
};

const getEmailFromGmail = async (tokens) => {
  console.log('> [gmail-robot] Iniciando robô do gmail...');
  let email = null;
  const headers = buildHeaders(tokens);
  const messageIds = await getMessageIds(headers);
  if (messageIds) email = await getBodyMessages(messageIds, headers);

  return email;
};

module.exports = { getRecentEmail, getEmailFromGmail };
