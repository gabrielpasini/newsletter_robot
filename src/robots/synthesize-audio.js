const fs = require('fs');
const gTTS = require('gtts');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

let ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const { errorLog } = require('../webhooks.js');

const email = require('../../email.json');
const originalAudio = 'raw_audio.mp3';
const acceleratedAudio = 'final_audio.mp3';

const accelerationFactor = 1.5;

async function editAudio() {
  return await new Promise((resolve, reject) => {
    console.log(`> [audio-robot] Editando arquivo de audio...`);
    const command = ffmpeg(originalAudio)
      .audioFilters('atempo=' + accelerationFactor)
      .save(acceleratedAudio);

    command
      .on('error', ({ message }) =>
        errorLog(`> [audio-robot] Erro ao editar o audio: ${message}`)
      )
      .on('progress', ({ targetSize }) =>
        console.log(`> [audio-robot] Processando edicao: ${targetSize}kB`)
      )
      .on('end', () => {
        console.log(
          `> [audio-robot] Audio final gerado no arquivo: ${acceleratedAudio}`
        );
        fs.unlink(originalAudio, (err) => {
          if (err) {
            errorLog('> [audio-robot] Erro au deletar a amostra de audio');
            throw new Error(err);
          }
          resolve();
          console.log('> [audio-robot] Amostra de audio deletada com sucesso');
        });
      });
  });
}

async function synthesizeAudio() {
  return await new Promise((resolve, reject) => {
    const gtts = new gTTS(email.formattedContent, 'pt-br');
    console.log('> [audio-robot] Criando arquivo de audio...');
    gtts.save(originalAudio, (err, result) => {
      if (err) throw new Error(err);
      console.log(
        `> [audio-robot] Amostra de audio gerada no arquivo: ${originalAudio}`
      );
      editAudio().then(() => resolve());
    });
  });
}

module.exports = synthesizeAudio;
