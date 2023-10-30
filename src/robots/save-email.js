const { errorLog } = require('../webhooks.js');

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
        return resolve(true);
      }
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

async function addVideoIdToEmail(emailId, videoId) {
  try {
    await EmailModel.findOneAndUpdate(
      { id: emailId },
      {
        $set: {
          videoId,
        },
      }
    );
    console.log('> [persistence-robot] videoId incluido no email salvo');
  } catch (err) {
    console.error(
      '> [persistence-robot] Erro ao atualizar o videoId no email: ' + err
    );
    errorLog(
      '> [persistence-robot] Erro ao atualizar o videoId no email: ' + err
    );
    return reject(true);
  }
}

module.exports = { saveEmail, addVideoIdToEmail };
