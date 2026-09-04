# Painel — Rachel Patrocínio

Painel interno para revisar trending topics e marcar quando o carrossel
já foi gerado no Canva Bulk Create. Lê e escreve direto na planilha do
Google Sheets.

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

## Deploy no Vercel

1. Suba esta pasta para um repositório no GitHub (o .gitignore já
   impede o .env.local de ir junto).
2. Em vercel.com → "Add New Project" → importe o repositório.
3. Antes do primeiro deploy (ou depois, em Settings → Environment
   Variables), adicione as 3 variáveis acima com os valores reais.
4. Deploy.

## Como funciona

- A planilha precisa ter a aba chamada exatamente "Carrosséis" com os
  cabeçalhos: trending_topic, status, slide1_titulo, slide1_imagem,
  slide2_titulo, slide2_lista, slide2_imagem, slide3_titulo,
  slide3_imagem, slide4_titulo, slide4_lista, slide4_imagem,
  slide5_titulo, slide5_imagem.
- O painel mostra as linhas com status diferente de "gerado" na seção
  "Prontos para revisar".
- Clicar em "Gerar carrossel" atualiza a coluna status dessa linha para
  "gerado" na planilha real.
