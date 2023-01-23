const { errorLog } = require('../webhooks.js');

function makeDescription(links) {
  let linkString = '';
  links.map((link) => (linkString = linkString + link + '\r\n'));
  const desc = `ASSINE A NEWSLETTER GRATUITAMENTE PELO LINK: https://filipedeschamps.com.br/newsletter\r\n\r\n${
    links.length > 0 ? `Links citados no vídeo:\r\n${linkString}` : ''
  }\r\nESTE ROBÔ FOI CRIADO COM O INTUITO DE TESTAR AS TECNOLOGIAS, PROMOVER A NEWSLETTER E DISSEMINAR ESSSAS INFORMAÇÕES FILTRADAS E CONFIÁVEIS DISPONIBILIZADAS NELA GRATUITAMENTE.\r\n\r\nDesenvolvido por Gabriel Pasini: https://pasini.dev`;
  console.log('> [formatter-robot] Descricao de video criada');
  return desc;
}

function formatEmail(objEmail) {
  try {
    if (objEmail) {
      let text = objEmail?.content?.includes('Filipe Deschamps Newsletter')
        ? objEmail?.content?.split('Filipe Deschamps Newsletter')[1]
        : objEmail?.content;
      text = text.split('Cancelar inscrição (')[0];
      text = text.replace(/(\n\n)/gm, '#####');
      text = text.replace(/(\n)/gm, ' ');
      text = text.replace(/(#####)/gm, '\r\n');
      const links = text.match(/\bhttps?:\/\/\S+/gi);
      const description = makeDescription(links);
      const tags = objEmail?.subject?.split(' / ');
      //remove urls
      text = text.replace(
        /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/g,
        ''
      );
      //substitui "Link Patrocinado/Afiliado" por "Link na descrição"
      text = text.replace('Link Patrocinado (  )', 'Link na descrição!');
      text = text.replace('Link Afiliado (  )', 'Link na descrição!');
      text = text.replace('Link do Vídeo (  )', 'Link na descrição!');
      //adiciona finalização
      text =
        text +
        'Este robô foi desenvolvido por Gabriel Pasini!\r\nDeixe o like e se inscreva! Até a próxima!';
      objEmail.formattedContent = text;
      objEmail.description = description;
      objEmail.tags = tags;
      console.log('> [formatter-robot] Conteudo formatado com sucesso');
      return objEmail;
    }
  } catch (err) {
    console.error('> [formatter-robot] Erro ao formatar o conteudo: ' + err);
    errorLog('> [formatter-robot] Erro ao formatar o conteudo: ' + err);
    throw err;
  }
}

module.exports = formatEmail;
