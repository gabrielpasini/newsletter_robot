const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const email = require('../../email.json');

const client = new textToSpeech.TextToSpeechClient();

(async function () {
  console.log('> [mp3-robot] Criando arquivo de audio...');
  const request = {
    input: {
      text: email.formattedContent,
    },
    voice: {
      languageCode: 'pt-BR',
      ssmlGender: 'MASCULINO',
      name: 'pt-BR-Wavenet-B',
    },
    audioConfig: {
      effectsProfileId: ['headphone-class-device'],
      pitch: -2,
      speakingRate: 1.1,
      audioEncoding: 'MP3',
    },
  };
  const [response] = await client.synthesizeSpeech(request);
  const writeFile = util.promisify(fs.writeFile);
  await writeFile(`audio.mp3`, response.audioContent, 'binary');
  console.log(`> [mp3-robot] Audio exportado no arquivo: audio.mp3`);
})();
