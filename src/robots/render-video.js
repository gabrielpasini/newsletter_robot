const fs = require('fs');
const path = require('path');
const videoshow = require('videoshow');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

const { errorLog } = require('../webhooks.js');

const imageStart = path.join(__dirname, '../../image-start.jpg');
const imageEnd = path.join(__dirname, '../../image-end.jpg');
const image = path.join(__dirname, '../../image.jpg');
const audio = path.join(__dirname, '../../final_audio.mp3');
const video = path.join(__dirname, '../../output.mp4');

let ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

async function renderVideo() {
  return await new Promise((resolve, reject) => {
    try {
      console.log('> [video-robot] Iniciando renderizacao...');
      const stats = fs.statSync('final_audio.mp3');
      const fps = 24;
      const width = 1280;
      const height = 720;
      const bitrate = 1024;
      const duration = (stats.size * 8) / 32000;
      const videoOptions = {
        fps: fps,
        transition: true,
        transitionDuration: 1,
        videoBitrate: bitrate,
        videoCodec: 'libx264',
        size: `${width}x${height}`,
        audioBitrate: '128k',
        audioChannels: 2,
        format: 'mp4',
        pixelFormat: 'yuv420p',
        captionDelay: 0,
        useSubRipSubtitles: false,
      };
      videoshow(
        [
          {
            path: imageStart,
            loop: 10,
          },
          {
            path: image,
            loop: duration - 30,
          },
          {
            path: imageEnd,
            loop: 20,
          },
        ],
        videoOptions
      )
        .audio(audio)
        .save(video)
        .on('start', () => {
          console.log('> [video-robot] Criando video...');
        })
        .on('error', (err, stdout, stderr) => {
          errorLog('> [video-robot] Erro ao criar o video: ' + err);
          reject(err);
        })
        .on(
          'progress',
          (progress) =>
            progress.percent < 100 &&
            console.log(
              `> [video-robot] Processando edicao: ${progress.percent.toFixed(
                2
              )}%`
            )
        )
        .on('end', () => {
          console.log('> [video-robot] Video gerado no arquivo: output.mp4');
          resolve();
        });
    } catch (err) {
      errorLog('> [video-robot] Erro ao criar o video: ' + err);
      reject(err);
    }
  });
}

module.exports = renderVideo;
