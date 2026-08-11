# Sistema de candidaturas MUNA Luanda

Portal de recrutamento com submissao real, API administrativa, routing de responsaveis, envio SMTP, PDF automatico e documentos protegidos por links temporarios.

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

Em desenvolvimento, sem `BLOB_READ_WRITE_TOKEN`, os dados podem ficar em `data/`. Essa pasta esta no `.gitignore` e nao deve ser enviada para o GitHub.

Em producao, `data/` nunca e usado como fallback. Se `BLOB_READ_WRITE_TOKEN` nao estiver configurado, a submissao e bloqueada com erro claro.

## Producao na Vercel

Este projeto esta preparado para Vercel com:

- ficheiros estaticos na raiz;
- API Express em `api/index.js`;
- rewrites em `vercel.json`;
- storage persistente via Vercel Blob privado quando `BLOB_READ_WRITE_TOKEN` estiver configurado.

Crie um Blob Store privado no projeto da Vercel e configure as variaveis abaixo em Project Settings -> Environment Variables. Nao coloque secrets no codigo, no README, no frontend ou em commits.

## Environment Variables

- `EMAIL_JOAO_PEDRO`: e-mail real do Joao Pedro, que recebe todas as candidaturas.
- `SMTP_HOST`: servidor SMTP. Para Gmail, use `smtp.gmail.com`.
- `SMTP_PORT`: porta SMTP. Para Gmail com SSL, use `465`.
- `SMTP_SECURE`: modo seguro. Para Gmail na porta `465`, use `true`.
- `SMTP_USER`: utilizador SMTP. Para este projeto, use a conta Gmail de envio.
- `SMTP_PASSWORD`: Google App Password da conta Gmail. Nunca use a password normal da conta e nunca guarde este valor no codigo.
- `EMAIL_FROM`: endereco remetente autorizado pelo SMTP.
- `ADMIN_TOKEN`: secret forte usado apenas nas APIs administrativas. Deve ter pelo menos 32 caracteres aleatorios.
- `DOWNLOAD_SECRET`: secret forte usado para assinar links temporarios de documentos. Deve ter pelo menos 32 caracteres aleatorios.
- `APP_BASE_URL`: URL publica do deploy, sem barra final. Configure com o dominio real em producao e com a URL de preview quando quiser testar previews.
- `BLOB_READ_WRITE_TOKEN`: token read/write do Vercel Blob privado. Necessario em producao para armazenar candidaturas, CVs, documentos e PDFs.
- `MAX_FILE_SIZE_MB`: limite maximo por ficheiro, por padrao `5`.

## SMTP

O backend usa `nodemailer` e considera o e-mail enviado apenas quando o transporte SMTP retorna sucesso real. Se SMTP nao estiver configurado ou falhar, a candidatura continua armazenada e fica com `emailStatus: failed`, permitindo reenvio no painel administrativo.

Para a conta Gmail de envio, configure na Vercel:

- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_USER=luandamuna@gmail.com`
- `EMAIL_FROM=luandamuna@gmail.com`
- `SMTP_PASSWORD` com a Google App Password real

O painel administrativo tem um botao de teste SMTP. Ele usa a mesma configuracao do envio real e envia o teste para `EMAIL_JOAO_PEDRO`.

No fornecedor de e-mail, confirme:

- remetente `EMAIL_FROM` autorizado;
- credenciais SMTP ativas;
- porta e modo TLS corretos;
- SPF/DKIM/DMARC do dominio configurados para melhorar entrega.

## Armazenamento Persistente

Na Vercel, o filesystem das funcoes nao deve ser usado para uploads persistentes. Por isso, em producao o sistema exige `BLOB_READ_WRITE_TOKEN` e grava diretamente no Vercel Blob privado:

- candidatura completa em JSON;
- CVs e documentos anexados;
- PDF/dossie gerado pelo servidor.

Os documentos ficam em Blob privado e so sao servidos por `/api/download/:token`, com token assinado por `DOWNLOAD_SECRET`. O download faz streaming do Vercel Blob para o dispositivo do diretor; nao grava CVs, PDFs ou anexos no computador de desenvolvimento.

## Painel Administrativo

O painel fica em `/admin.html`. As APIs administrativas exigem `X-Admin-Token` com o valor de `ADMIN_TOKEN`.

## Verificacao

```bash
npm run build
npm audit --omit=dev
```
