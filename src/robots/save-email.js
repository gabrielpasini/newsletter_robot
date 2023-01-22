const fs = require('fs');

const EmailModel = require('../models/email.js');

async function saveEmail(email) {
  return await new Promise(async (resolve, reject) => {
    try {
      const savedEmail = await EmailModel.findOne({ id: email.id });
      if (savedEmail) {
        console.log(
          '> [persistence-robot] Este e-mail ja esta salvo! Tente novamente no proximo dia util...'
        );
        return resolve(false);
      } else {
        await EmailModel.create(email);
        console.log(
          '> [persistence-robot] Novo e-mail salvo no banco de dados'
        );
        const jsonFile = JSON.stringify(email, null, 2);
        fs.writeFileSync('text.json', jsonFile);
        console.log(
          '> [persistence-robot] Novo e-mail salvo no arquivo: text.json'
        );
      }
      return resolve(true);
    } catch (err) {
      console.log(
        '> [persistence-robot] Erro ao salvar/atualizar o email: ' + err
      );
      return reject(true);
    }
  });
}

module.exports = saveEmail;
