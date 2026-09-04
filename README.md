# Painel — Rachel Patrocínio

Painel interno para revisar trending topics e marcar quando o carrossel
já foi gerado no Canva Bulk Create. Lê e escreve direto na planilha do
Google Sheets. Toda semana, uma rotina automática (Vercel Cron) busca
novos trending topics, gera o texto dos 5 slides com IA e busca imagens
contextuais, escrevendo tudo direto na planilha.

## Rodar localmente

1. Copie `.env.local.example` para `.env.local` e preencha com os
   valores reais (nunca commitar esse arquivo).
2. npm install
3. npm run dev
4. Abre em http://localhost:3000

## Variáveis de ambiente necessárias

- GOOGLE_SHEET_ID — o ID da planilha (trecho da URL entre /d/ e /edit)
- GOOGLE_SERVICE_ACCOUNT_EMAIL — o client_email do JSON da conta de serviço
- GOOGLE_PRIVATE_KEY — a private_key do JSON da conta de serviço, entre aspas
- ANTHROPIC_API_KEY — chave da API da Anthropic (console.anthropic.com),
  usada para gerar o texto dos carrosséis
- UNSPLASH_ACCESS_KEY — chave gratuita da API do Unsplash
  (developers.unsplash.com → "New Application"), usada para buscar as
  imagens de fundo contextuais
- CRON_SECRET — uma senha qualquer, longa e aleatória, inventada por
  você. Protege a rota de automação para que só o Vercel Cron consiga
  chamá-la

## Deploy no Vercel

1. Suba esta pasta para um repositório no GitHub.
2. Em vercel.com → "Add New Project" → importe o repositório.
3. Em Settings → Environment Variables, adicione as 6 variáveis acima
   com os valores reais.
4. Deploy.
5. O arquivo `vercel.json` já configura a automação para rodar toda
   segunda-feira às 8h (horário de Brasília) — não precisa configurar
   nada a mais no painel do Vercel para isso funcionar.

## Testar a automação manualmente (sem esperar a segunda-feira)

Depois do deploy, chame a rota manualmente com uma ferramenta como o
curl, passando o CRON_SECRET como token:

curl -H "Authorization: Bearer SEU_CRON_SECRET" \
  https://SEU-SITE.vercel.app/api/cron/trending

A resposta mostra quais tópicos foram adicionados (ou o erro, se algo
faltar).

## Como funciona

- A planilha precisa ter a aba chamada exatamente "Carrosséis" com os
  cabeçalhos: trending_topic, status, slide1_titulo, slide1_imagem,
  slide2_titulo, slide2_lista, slide2_imagem, slide3_titulo,
  slide3_imagem, slide4_titulo, slide4_lista, slide4_imagem,
  slide5_titulo, slide5_imagem.
- Toda semana, a rotina automática busca os trending topics do Brasil
  no Google Trends, ignora os que já existem na planilha, gera o texto
  dos 5 slides com IA (no tom de voz da Rachel) e busca uma imagem
  contextual por slide no Unsplash — tudo isso vira uma linha nova com
  status "pendente".
- O painel mostra as linhas com status diferente de "gerado" na seção
  "Prontos para revisar".
- Clicar em "Gerar carrossel" atualiza a coluna status dessa linha para
  "gerado" na planilha real.
