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
- `SMTP_HOST`: host SMTP do fornecedor de e-mail.
- `SMTP_PORT`: porta SMTP, normalmente `587` para TLS via STARTTLS ou `465` para SSL.
- `SMTP_USER`: utilizador da conta SMTP.
- `SMTP_PASSWORD`: password, app password ou token SMTP. Nunca use `SMTP_PASS` em producao.
- `EMAIL_FROM`: remetente autorizado pelo SMTP, por exemplo `"Model UN Academy Luanda Chapter <recrutamento@dominio.com>"`.
- `ADMIN_TOKEN`: secret forte usado apenas nas APIs administrativas. Deve ter pelo menos 32 caracteres aleatorios.
- `DOWNLOAD_SECRET`: secret forte usado para assinar links temporarios de documentos. Deve ter pelo menos 32 caracteres aleatorios.
- `APP_BASE_URL`: URL publica do deploy, sem barra final. Configure com o dominio real em producao e com a URL de preview quando quiser testar previews.
- `BLOB_READ_WRITE_TOKEN`: token read/write do Vercel Blob privado. Necessario em producao para armazenar candidaturas, CVs, documentos e PDFs.
- `MAX_FILE_SIZE_MB`: limite maximo por ficheiro, por padrao `5`.

## SMTP

O backend usa `nodemailer` e considera o e-mail enviado apenas quando o transporte SMTP retorna sucesso real. Se SMTP nao estiver configurado ou falhar, a candidatura continua armazenada e fica com `emailStatus: failed`, permitindo reenvio no painel administrativo.

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
