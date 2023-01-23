const fs = require('fs');
const path = require('path');

const email = require('../../email.json');
const videoFilePath = path.join(__dirname, '../../output.mp4');
const videoThumbnailFilePath = path.join(__dirname, '../../thumbnail.jpg');

async function setThumbnail(videoId, youtube) {
  console.log(`> [youtube-robot] Iniciando upload da thumbnail`);
  const requestParameters = {
    videoId: videoId,
    media: {
      mimeType: 'image/jpeg',
      body: fs.createReadStream(videoThumbnailFilePath),
    },
  };
  await youtube.thumbnails.set(requestParameters);
  console.log(`> [youtube-robot] Thumbnail carregada`);
  return videoId;
}

async function uploadContent(youtube) {
  console.log('> [youtube-robot] Iniciando upload do video para o YouTube...');
  const videoFileSize = fs.statSync(videoFilePath).size;
  const videoTitle = email.subject;
  const videoTags = email.tags;
  const videoDescription = email.description.toString();
  const requestParameters = {
    part: 'snippet, status',
    requestBody: {
      snippet: {
        title: videoTitle,
        description: videoDescription,
        tags: videoTags,
        categoryId: 28, // ScienceTechnology
        defaultLanguage: 'pt-br',
        defaultAudioLanguage: 'pt-br',
      },
      status: {
        privacyStatus: 'private',
      },
    },
    media: {
      body: fs.createReadStream(videoFilePath),
    },
  };
  const {
    data: { id },
  } = await youtube.videos.insert(requestParameters, {
    onUploadProgress: (event) =>
      console.log(
        `> [youtube-robot] Fazendo upload: ${Math.round(
          (event.bytesRead / videoFileSize) * 100
        )}%`
      ),
  });
  console.log(`> [youtube-robot] Upload completo`);
  return setThumbnail(id, youtube);
}

module.exports = uploadContent;
