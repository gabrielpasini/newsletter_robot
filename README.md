# newsletter_robot [![youtube](https://img.shields.io/website-up-down-green-red/http/monip.org.svg?label=Youtube)](https://www.youtube.com/@noticiastecnologia-newsletter)

Robô criado em NodeJS para buscar o último e-mail recebido da Newsletter do Filipe Deschamps, formatar o texto, criar um áudio a partir do texto, transformá-lo em vídeo e subir no youtube com thumbnail, descrição, tags, tudo automático.

### >> Configurando arquivos necessários para rodar o projeto...

- `privkey.pem` e `cert.pem` utilizados apenas para rodar o servidor em https com certificado SSL. Caso prefira rodá-lo localmente com http mesmo, é só alterar o seguinte trecho de código no arquivo `src/index.js`:

  HTTPS:

  ```Javascript
  async function startWebServer() {
    return await new Promise((resolve, reject) => {
      https
        .createServer(
          {
            key: fs.readFileSync('privkey.pem'),
            cert: fs.readFileSync('cert.pem'),
          },
          app
        )
        .listen(process.env.PORT, () => {
          console.log(`> [server] Rodando servidor em ${process.env.BASE_URI}`);
          resolve();
        });
    });
  }
  ```

  HTTP:

  ```Javascript
  async function startWebServer() {
    return await new Promise((resolve, reject) => {
        app.listen(process.env.PORT, () => {
          console.log(`> [server] Rodando servidor em ${process.env.BASE_URI}`);
          resolve();
        });
    });
  }
  ```

- `.env` contendo todas as variáveis de ambiente, conforme o exemplo abaixo:
  ```
  PORT=5000
  MONGO_DB=KEY_DO_SEU_SERVIDOR_MONGODB
  CLIENT_ID=SEU_CLIENTID_DA_API_DO_GOOGLE
  CLIENT_SECRET=SEU_CLIENT_SECRET_DA_API_DO_GOOGLE
  USER_ID=EMAIL_QUE_VAI_RECEBER_A_NEWSLETTER
  SENDER_ID=newsletter@filipedeschamps.com.br
  WEBHOOK_AUTH=URL_DO_SEU_WEBHOOK_QUE_ENVIARA_O_LINK_PARA_A_AUTENTICACAO
  WEBHOOK_ERROR=URL_DO_SEU_WEBHOOK_QUE_ENVIARA_A_MENSAGEM_DE_ERRO
  WEBHOOK_SUCCESS=URL_DO_SEU_WEBHOOK_QUE_ENVIARA_O_LINK_DO_VIDEO_PRONTO
  BASE_URI=http://localhost:5000 OU https://localhost:5000
  ```
  Para criar suas chaves da API do google, basta seguir [este tutorial](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br);

  No meu caso, criei webhooks em um servidor do Discord, é super fácil e você pode aprender [neste tutorial](https://support.discord.com/hc/pt-br/articles/228383668);

### >> Agora que seu projeto já está rodando, precisamos entender as rotas...

- A rota base `/` mostra o vídeo e email mais recentes criados;
- A rota `/start` dispara o robô, verificando se há um novo e-mail e então dispara o serviço de autenticação que envia o link para o webhook configurado `WEBHOOK_AUTH`;
- A rota `/retry` dispara o robô gerando um vídeo através do último e-mail salvo, independentemente se já existe um vídeo dele ou não;
