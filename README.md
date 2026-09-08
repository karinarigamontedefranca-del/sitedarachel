# Gerador de Posts — Rachel Patrocínio (versão Vercel)

## Estrutura do projeto (importante não mudar os nomes de pasta)

```
├── api/
│   └── index.py       <- todo o backend (Flask)
├── public/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── fonts/
├── vercel.json
└── requirements.txt
```

## Passo a passo do deploy

### 1. Subir esses arquivos pro GitHub

No repositório que você já criou (`sitedarachel`), **apague os arquivos antigos do
template Next.js** (o que estava causando o erro de build) e suba esses arquivos
no lugar, mantendo exatamente essa estrutura de pastas.

### 2. Conectar o repositório na Vercel

Se já estava conectado, um novo push já dispara um novo deploy automaticamente.

### 3. Ativar o armazenamento de imagem (Vercel Blob)

Isso substitui a necessidade de qualquer conta externa pra guardar as fotos:

1. Dentro do projeto na Vercel, vá na aba **Storage**
2. **Create Database** → escolha **Blob**
3. Dê um nome (ex: `rachel-posts-media`) → **Create**
4. A Vercel já conecta automaticamente ao projeto e cria a variável
   `BLOB_READ_WRITE_TOKEN` sozinha — não precisa copiar/colar nada aqui.

### 4. Configurar as outras duas variáveis de ambiente

Em **Project → Settings → Environment Variables**, adicione:

| Nome | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | sua chave de platform.claude.com |
| `UNSPLASH_ACCESS_KEY` | sua chave de unsplash.com/developers (opcional) |

Depois de adicionar, vá em **Deployments** → nos três pontinhos do último
deploy → **Redeploy** (variáveis novas só valem a partir do próximo deploy).

### 5. Acessar

A Vercel te dá uma URL tipo `sitedarachel.vercel.app` — é essa que a Rachel usa.

## Sobre o plano gratuito da Vercel (Hobby)

- Funções têm limite de tempo de execução (a geração dos 7 slides em conjunto
  deve caber dentro do limite, mas se o `/api/render` der timeout, o sintoma é
  a tela travar em "Gerando arquivos finais..." — nesse caso me avise que eu
  ajusto o código pra gerar os slides um por vez em vez de todos juntos).
- O plano Hobby é oficialmente para uso pessoal/não-comercial. Como esse é um
  projeto de trabalho da Rachel, vale ficar de olho: se o uso crescer bastante,
  o caminho correto passa a ser o plano Pro (US$20/mês).

## Rodando localmente antes de subir (opcional, pra testar)

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY="..."
export UNSPLASH_ACCESS_KEY="..."
export BLOB_READ_WRITE_TOKEN="..."   # pegue em Storage -> sua Blob store -> .env.local
python api/index.py
```
Isso só funciona rodando com `python api/index.py` diretamente (sem o `vercel dev`),
pois adicionamos `app.run()` no fim do arquivo só pra esse teste local — a Vercel
ignora essa linha em produção e chama o objeto `app` diretamente.
