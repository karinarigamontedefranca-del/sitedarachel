# Gerador de Posts — Rachel Patrocínio

Site que gera carrosséis de Instagram automaticamente: a Rachel clica em um tema
em alta, e o sistema gera o texto (no tom de voz dela) + busca uma foto real
relacionada ao tema + monta a arte final no padrão visual do manual de marca dela.

## O que você precisa (as duas chaves gratuitas)

1. **ANTHROPIC_API_KEY**
   - Acesse: https://platform.claude.com
   - Crie uma conta (pode usar o mesmo e-mail da assinatura Pro — são contas
     separadas, mas podem compartilhar e-mail)
   - Vá em "API Keys" → "Create Key"
   - Cobrança: por uso (pay-as-you-go). Ganha US$5 de crédito grátis ao criar a conta.

2. **UNSPLASH_ACCESS_KEY**
   - Acesse: https://unsplash.com/developers
   - Clique em "Register as a developer" → "New Application"
   - Aceite os termos, dê um nome ao app (ex: "Rachel Patrocinio Posts")
   - Copie a "Access Key" gerada
   - Gratuito. O plano de testes ("Demo") permite 50 buscas por hora — mais que
     suficiente para gerar alguns posts por semana. Se um dia precisarem de mais
     volume, dá para solicitar produção (ainda gratuito) direto no painel deles.

## Instalação (rodando localmente, no seu computador)

```bash
cd rachel-post-generator
pip install -r requirements.txt

export ANTHROPIC_API_KEY="cole_aqui_sua_chave"
export UNSPLASH_ACCESS_KEY="cole_aqui_sua_chave"

python app.py
```

Depois abra **http://localhost:5000** no navegador.

## Colocando no ar (pra Rachel acessar de qualquer lugar, não só no seu PC)

Esse projeto é um site Flask comum — pode ser hospedado em qualquer serviço que
rode Python, por exemplo:
- Render.com (tem plano gratuito)
- Railway.app
- Um servidor próprio (VPS)

Em qualquer um deles, o processo é: subir esses arquivos, configurar as duas
variáveis de ambiente (ANTHROPIC_API_KEY e UNSPLASH_ACCESS_KEY) no painel do
serviço, e apontar o comando de start para `python app.py`.

## Como funciona por dentro

- `GET /api/trending` → pergunta pro Claude (com busca na web ativada) quais são
  os assuntos em alta agora relacionados a marketing/branding, e devolve 6 temas.
- `POST /api/generate` → pede pro Claude escrever o roteiro dos 7 slides no tom de
  voz da Rachel; para os slides marcados como "visuais", busca uma foto real no
  Unsplash; monta cada slide (1080x1350px) com as fontes e cores do manual de
  marca (`fonts/PlayfairDisplay-*.ttf` e `fonts/Montserrat-*.ttf`).
- As imagens finais ficam salvas em `generated/<id>/slide_01.jpg` etc., prontas
  para baixar e postar.

## Personalizando

- Cores e fontes: no topo do `app.py`, em `BROWN_DEEP`, `ROSE`, `CREAM`.
- Tom de voz / estrutura do roteiro: no texto de `script_prompt`, dentro da
  função `api_generate` em `app.py`.
- Quantidade de posts/temas mostrados: ajuste o prompt de `api_trending`.

## Sobre direitos de imagem

As fotos vêm da API oficial do Unsplash, que licencia uso gratuito, inclusive
comercial, sem necessidade de crédito (mas é uma boa prática dar crédito quando
possível). O prompt já instrui a IA a nunca pedir fotos de pessoas famosas
identificáveis nem de logos de marcas registradas, para evitar problemas de
direitos de imagem/marca.
