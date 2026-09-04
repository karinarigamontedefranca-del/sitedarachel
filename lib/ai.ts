export type CarouselCopy = {
  slide1_titulo: string;
  slide2_titulo: string;
  slide2_lista: string;
  slide3_titulo: string;
  slide4_titulo: string;
  slide4_lista: string;
  slide5_titulo: string;
  imagem_busca: string;
};

const ALLOWED_THEMES = `- Redes sociais: mudanças de algoritmo, novos recursos, tendências de conteúdo, comportamento de criadores.
- Filmes, séries e streaming em alta: lançamentos, prêmios, hype, repercussão cultural.
- Marketing e branding: campanhas, cases, movimentos do mercado publicitário, rebrandings.
- Cultura pop ligada à criação de conteúdo digital em geral.`;

const FORBIDDEN_THEMES = `Acidentes, mortes, tragédias, crimes, violência, desastres, política/eleições,
saúde/doenças, guerra, qualquer assunto sensível ou de luto.`;

async function callAnthropic(system: string, userText: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Variável ANTHROPIC_API_KEY não configurada.");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: userText }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Falha na API da Anthropic: ${res.status} ${detail}`);
  }

  const data = await res.json();
  const textBlock = (data.content ?? []).find(
    (block: { type: string }) => block.type === "text"
  );

  if (!textBlock) {
    throw new Error("Resposta da IA veio sem texto.");
  }

  return textBlock.text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();
}

const FILTER_SYSTEM_PROMPT = `Você cura os trending topics que viram carrossel de Instagram da
Rachel Patrocínio, professora de branding e marca pessoal.

Só interessam tópicos destes temas:
${ALLOWED_THEMES}

NUNCA selecione tópicos sobre:
${FORBIDDEN_THEMES}

Na dúvida sobre um tópico (ambíguo, sensível, ou você não sabe do que se trata),
NÃO selecione — é mais seguro deixar de fora do que incluir algo indevido.

Responda APENAS com um array JSON de strings, contendo os títulos exatos (copiados
como vieram) dos tópicos aprovados, em ordem de relevância. Se nenhum tópico da lista
se encaixar, responda com um array vazio: []`;

export async function filterRelevantTopics(
  topics: string[]
): Promise<string[]> {
  if (topics.length === 0) return [];

  const list = topics.map((t, i) => `${i + 1}. ${t}`).join("\n");
  const cleaned = await callAnthropic(
    FILTER_SYSTEM_PROMPT,
    `Lista de trending topics de hoje:\n${list}`
  );

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t): t is string => typeof t === "string");
  } catch {
    return [];
  }
}

const CONTENT_SYSTEM_PROMPT = `Você escreve os carrosséis de Instagram da Rachel Patrocínio,
professora de branding e marca pessoal. O tom é editorial, direto, com frases de
impacto curtas — nunca genérico ou motivacional raso. Cada carrossel conecta um
assunto em alta (sempre dentro dos temas: redes sociais, filmes/séries/streaming em
alta, ou marketing/branding) a uma lição real sobre branding ou marca pessoal.

Gere sempre exatamente esta estrutura de 5 slides:
- slide1_titulo: frase de abertura/gancho (1-2 frases curtas), sem lista.
- slide2_titulo: frase que introduz um desdobramento em pontos.
- slide2_lista: exatamente 3 itens numerados ("1. ...\\n2. ...\\n3. ..."), cada um curto (até 12 palavras).
- slide3_titulo: uma frase de virada/respiro (1-2 frases curtas), sem lista.
- slide4_titulo: frase que introduz outro desdobramento em pontos.
- slide4_lista: exatamente 3 itens numerados, mesmo formato do slide2_lista.
- slide5_titulo: frase de fechamento forte (1-2 frases curtas), sem lista.
- imagem_busca: uma descrição visual curta EM INGLÊS (2 a 5 palavras) do tipo de foto
  de banco de imagens que ilustraria bem esse assunto — algo concreto e fotografável
  (ex: "smartphone social media app", "movie theater screen", "marketing team meeting").
  NUNCA inclua nomes de pessoas reais, marcas registradas ou personagens — descreva a
  cena/conceito genérico por trás do assunto, não o assunto literal.

Responda APENAS com um objeto JSON válido, sem markdown, sem texto antes ou depois,
com exatamente essas 8 chaves.`;

export async function generateCarouselContent(
  topic: string
): Promise<CarouselCopy> {
  const cleaned = await callAnthropic(
    CONTENT_SYSTEM_PROMPT,
    `Trending topic da semana: "${topic}"`
  );
  return JSON.parse(cleaned) as CarouselCopy;
}
