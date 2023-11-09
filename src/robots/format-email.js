const { errorLog } = require('../webhooks.js');

function makeDescription(links) {
  let linkString = '';
  links.map((link) => (linkString = linkString + link + '\r\n'));
  const desc = `ASSINE A NEWSLETTER GRATUITAMENTE PELO LINK: https://filipedeschamps.com.br/newsletter\r\n\r\n${
    links.length > 0 ? `Links citados no vídeo:\r\n${linkString}` : ''
  }\r\nESTE ROBÔ FOI CRIADO COM O INTUITO DE TESTAR AS TECNOLOGIAS, PROMOVER E DISSEMINAR AS INFORMAÇÕES FILTRADAS E CONFIÁVEIS DISPONIBILIZADAS GRATUITAMENTE NA INTERNET.\r\n\r\nDesenvolvido por Gabriel Pasini: https://pasini.dev`;
  console.log('> [formatter-robot] Descricao de video criada');
  return desc;
}

function formatEmail(objEmail) {
  try {
    if (objEmail) {
      let text = objEmail?.content?.toLowerCase();
      //delimita o inicio e o fim do texto
      text = text.includes('filipe deschamps newsletter')
        ? text.split('filipe deschamps newsletter')[1]
        : text;
      text = text.split('cancelar inscrição (')[0];
      //ajusta as quebras de linhas
      text = text.replace(/(\n\n)/gm, '#####');
      text = text.replace(/(\n)/gm, ' ');
      text = text.replace(/(\r \r )/gm, '#####');
      text = text.replace(/(\r)/gm, '');
      text = text.replace(/(#####)/gm, '\r\n');
      //separa os links e remove do texto
      const links = text.match(/\bhttps?:\/\/\S+/gi);
      text = text.replace(
        /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/g,
        ''
      );
      //substitui "Link Patrocinado/Afiliado" por "Link na descrição"
      text = text.replace(/link patrocinado \([^()]*\)/g, 'link na descrição!');
      text = text.replace(/link afiliado \([^()]*\)/g, 'link na descrição!');
      text = text.replace(/link do vídeo \([^()]*\)/g, 'link na descrição!');
      text = text.replace(/link do curso \([^()]*\)/g, 'link na descrição!');
      text = text.replace(/link do evento \([^()]*\)/g, 'link na descrição!');
      //adiciona finalização
      text =
        text +
        'este robô foi desenvolvido por gabriel pasini!\r\ndeixe o like e se inscreva! até a próxima!';

      const description = makeDescription(links);
      const tags = objEmail?.subject?.split(' / ');

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
