const fs = require('fs');
const path = require('path');
const Canvas = require('canvas');
const Image = Canvas.Image;

const { errorLog } = require('../webhooks.js');

const background = path.join(__dirname, '../../background.jpg');

const date = new Date();
const semana = [
  'Domingo',
  'Segunda-Feira',
  'Terça-Feira',
  'Quarta-Feira',
  'Quinta-Feira',
  'Sexta-Feira',
  'Sábado',
];

async function drawThumbnail() {
  return await new Promise((resolve, reject) => {
    try {
      console.log('> [thumbnail-robot] Iniciando Canvas...');
      const image = new Image();
      image.src = background;
      const canvas = Canvas.createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, image.width, image.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 120px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(date.toLocaleDateString(), 640, 140);
      ctx.font = 'bold 160px Courier New';
      ctx.fillText(semana[date.getDay()].toUpperCase(), 640, 300);
      ctx.font = 'bold 100px Courier New';
      ctx.fillText(`Notícias`, 640, 420);
      ctx.fillText(`de`, 640, 530);
      ctx.fillText(`Tecnologia`, 640, 650);

      const out = fs.createWriteStream('./thumbnail.jpg');
      const stream = canvas.createJPEGStream();
      stream.pipe(out);
      out.on('finish', () => {
        console.log(
          '> [thumbnail-robot] Thumbnail gerada no arquivo: thumbnail.jpg'
        );
        return resolve();
      });
    } catch (err) {
      console.error(`> [thumbnail-robot] Erro na geracao da thumbnail: ${err}`);
      errorLog(`> [thumbnail-robot] Erro na geracao da thumbnail: ${err}`);
      reject(err);
    }
  });
}

module.exports = drawThumbnail;
