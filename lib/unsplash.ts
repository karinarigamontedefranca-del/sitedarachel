export async function fetchImagesForTopic(
  topic: string,
  count: number
): Promise<string[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    throw new Error("Variável UNSPLASH_ACCESS_KEY não configurada.");
  }

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    topic
  )}&per_page=${count}&orientation=portrait`;

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${key}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Falha ao buscar imagens no Unsplash: ${res.status}`);
  }

  const data = await res.json();
  const results: { urls: { regular: string } }[] = data.results ?? [];

  const urls = results.map((r) => r.urls.regular);

  // Se o Unsplash não tiver resultados suficientes pro tópico, repete a
  // última imagem encontrada em vez de deixar o campo vazio.
  while (urls.length > 0 && urls.length < count) {
    urls.push(urls[urls.length - 1]);
  }

  return urls;
}

// Busca UMA imagem para uma descrição visual específica de um slide.
export async function fetchImageForQuery(query: string): Promise<string> {
  const images = await fetchImagesForTopic(query, 1);
  return images[0] ?? "";
}
