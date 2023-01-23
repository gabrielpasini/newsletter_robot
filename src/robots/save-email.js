const fs = require('fs');

const { errorLog } = require('../webhooks.js');

const EmailModel = require('../models/email.js');

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
        const jsonFile = JSON.stringify(email, null, 2);
        fs.writeFileSync('email.json', jsonFile);
        console.log(
          '> [persistence-robot] Novo e-mail salvo no arquivo: email.json'
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

module.exports = saveEmail;
