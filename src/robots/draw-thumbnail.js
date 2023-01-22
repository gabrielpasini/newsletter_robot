const fs = require('fs');
const path = require('path');
const Canvas = require('canvas');
const Image = Canvas.Image;

const background = path.join(__dirname, '../background.jpg');

async function createThumbnail() {
  return await new Promise((resolve, reject) => {
    console.log('> [thumbnail-robot] Iniciando Canvas...');
    const image = new Image();
    image.src = background;

    const canvas = Canvas.createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(image, 0, 0, image.width, image.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 100px Courier New';
    ctx.textAlign = 'center';

    const semana = [
      'Domingo',
      'Segunda-Feira',
      'Terça-Feira',
      'Quarta-Feira',
      'Quinta-Feira',
      'Sexta-Feira',
      'Sábado',
    ];
    const date = new Date();
    asudhaushasuhdasuhd;
    ctx.fillText(date.toLocaleDateString(), 640, 140);
    ctx.fillText(semana[date.getDay()].toUpperCase(), 640, 260);

    ctx.font = 'normal 80px Courier New';
    ctx.fillText(`Notícias`, 640, 400);
    ctx.fillText(`de`, 640, 500);
    ctx.fillText(`Tecnologia`, 640, 600);

    const out = fs.createWriteStream('./thumbnail.jpg');
    const stream = canvas.createJPEGStream();
    stream.pipe(out);
    out.on('finish', () => {
      console.log(
        '> [thumbnail-robot] Thumbnail gerada no arquivo: thumbnail.jpg'
      );
      return resolve();
    });
  });
}

module.exports = createThumbnail;
