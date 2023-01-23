const fs = require('fs');

const { errorLog } = require('../webhooks.js');

const EmailModel = require('../models/email.js');

async function getRecentEmail() {
  return await new Promise(async (resolve, reject) => {
    try {
      const storedDBEmail = await EmailModel.findOne().sort('-created_at');
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

async function saveEmail(email) {
  return await new Promise(async (resolve, reject) => {
    try {
      const savedEmail = await EmailModel.findOne({ id: email.id });
      if (savedEmail) {
        console.error(
          '> [persistence-robot] Este e-mail ja esta salvo! Tente novamente no proximo dia util...'
        );
        errorLog(
          '> [persistence-robot] Este e-mail ja esta salvo! Tente novamente no proximo dia util...'
        );
        return resolve(false);
      } else {
        await EmailModel.create(email);
        console.log(
          '> [persistence-robot] Novo e-mail salvo no banco de dados'
        );
      }
      return resolve(true);
    } catch (err) {
      console.error(
        '> [persistence-robot] Erro ao salvar/atualizar o email: ' + err
      );
      errorLog(
        '> [persistence-robot] Erro ao salvar/atualizar o email: ' + err
      );
      return reject(true);
    }
  });
}

module.exports = { saveEmail, getRecentEmail };
