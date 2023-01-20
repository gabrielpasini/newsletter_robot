const fs = require('fs');
const path = require('path');
const videoshow = require('videoshow');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const imageStart = path.join(__dirname, '../image-start.jpg');
const imageEnd = path.join(__dirname, '../image-end.jpg');
const image = path.join(__dirname, '../image.jpg');
const audio = path.join(__dirname, '../audio.mp3');
const video = path.join(__dirname, '../output.mp4');

let ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

async function renderVideo() {
  return new Promise((resolve, reject) => {
    console.log('> [video-robot] Iniciando FFmpeg...');
    const stats = fs.statSync('audio.mp3');
    const fps = 25;
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
        console.log('> [video-robot] Gerando vídeo...');
      })
      .on('error', (err, stdout, stderr) => {
        console.error('Error:', err);
        console.error('ffmpeg stderr:', stderr);
        reject(err);
      })
      .on('end', () => {
        console.log('> [video-robot] FFmpeg finalizado');
        resolve();
      });
  });
}

module.exports = renderVideo;
