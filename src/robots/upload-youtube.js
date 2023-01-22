const fs = require('fs');
const path = require('path');
const google = require('googleapis').google;
const youtube = google.youtube({ version: 'v3' });

const Content = require('../../text.json');
const videoFilePath = path.join(__dirname, '../../output.mp4');
const videoThumbnailFilePath = path.join(__dirname, '../../thumbnail.jpg');

async function setThumbnail(videoInformation) {
  console.log(`> [youtube-robot] Iniciando upload da thumbnail`);

  const videoId = videoInformation.id;
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

async function uploadContent() {
  const videoFileSize = fs.statSync(videoFilePath).size;
  const videoTitle = Content.subject;
  const videoTags = Content.tags;
  const videoDescription = Content.description.toString();
  const requestParameters = {
    part: 'snippet, status',
    requestBody: {
      snippet: {
        title: videoTitle,
        description: videoDescription,
        tags: videoTags,
      },
      status: {
        privacyStatus: 'unlisted',
      },
    },
    media: {
      body: fs.createReadStream(videoFilePath),
    },
  };
  console.log('> [youtube-robot] Iniciando upload do video para o YouTube...');
  const onUploadProgress = (event) => {
    const progress = Math.round((event.bytesRead / videoFileSize) * 100);
    console.log(`> [youtube-robot] Fazendo upload: ${progress}%`);
  };
  const youtubeResponse = await youtube.videos.insert(requestParameters, {
    onUploadProgress: onUploadProgress,
  });
  console.log(`> [youtube-robot] Upload completo`);
  return setThumbnail(youtubeResponse.data);
}

module.exports = uploadContent;
