export type TrendingTopic = {
  title: string;
};

// Lê o feed público do Google Trends (sem precisar de chave de API).
export async function fetchTrendingTopics(
  geo: string = "BR"
): Promise<TrendingTopic[]> {
  const url = `https://trends.google.com/trending/rss?geo=${geo}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; painel-rachel/1.0)",
    },
    // Nunca cachear: queremos os trends mais recentes a cada execução.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Falha ao buscar Google Trends: ${res.status}`);
  }

  const xml = await res.text();
  const items = xml.split("<item>").slice(1);

  const topics: TrendingTopic[] = items.map((chunk) => {
    const titleMatch = chunk.match(/<title>([\s\S]*?)<\/title>/);
    const rawTitle = titleMatch ? titleMatch[1] : "";
    const title = rawTitle
      .replace("<![CDATA[", "")
      .replace("]]>", "")
      .trim();
    return { title };
  });

  return topics.filter((t) => t.title.length > 0);
}
