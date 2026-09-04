export type CarouselCopy = {
  slide1_titulo: string;
  slide2_titulo: string;
  slide2_lista: string;
  slide3_titulo: string;
  slide4_titulo: string;
  slide4_lista: string;
  slide5_titulo: string;
};

const SYSTEM_PROMPT = `Você escreve os carrosséis de Instagram da Rachel Patrocínio,
professora de branding e marca pessoal. O tom é editorial, direto, com frases de
impacto curtas — nunca genérico ou motivacional raso. Cada carrossel conecta um
assunto em alta (trending topic) a uma lição real sobre branding ou marca pessoal.

Gere sempre exatamente esta estrutura de 5 slides:
- slide1_titulo: frase de abertura/gancho (1-2 frases curtas), sem lista.
- slide2_titulo: frase que introduz um desdobramento em pontos.
- slide2_lista: exatamente 3 itens numerados ("1. ...\\n2. ...\\n3. ..."), cada um curto (até 12 palavras).
- slide3_titulo: uma frase de virada/respiro (1-2 frases curtas), sem lista.
- slide4_titulo: frase que introduz outro desdobramento em pontos.
- slide4_lista: exatamente 3 itens numerados, mesmo formato do slide2_lista.
- slide5_titulo: frase de fechamento forte (1-2 frases curtas), sem lista.

Responda APENAS com um objeto JSON válido, sem markdown, sem texto antes ou depois,
com exatamente essas 7 chaves.`;

export async function generateCarouselContent(
  topic: string
): Promise<CarouselCopy> {
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
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Trending topic da semana: "${topic}"`,
        },
      ],
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

  const cleaned = textBlock.text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  return JSON.parse(cleaned) as CarouselCopy;
}
