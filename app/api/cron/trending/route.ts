import { NextRequest, NextResponse } from "next/server";
import { fetchTrendingTopics } from "../../../../lib/trends";
import { generateCarouselContent } from "../../../../lib/ai";
import { fetchImagesForTopic } from "../../../../lib/unsplash";
import { readSheetRows, appendRow, SHEET_COLUMNS } from "../../../../lib/sheets";

export const maxDuration = 300;

const MAX_NEW_TOPICS_PER_RUN = 3;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const results: { topic: string; status: string; detail?: string }[] = [];

  try {
    const existingRows = await readSheetRows();
    const existingTopics = new Set(
      existingRows.slice(1).map((r) => (r[0] ?? "").trim().toLowerCase())
    );

    const trending = await fetchTrendingTopics("BR");

    const newTopics = trending
      .filter((t) => !existingTopics.has(t.title.trim().toLowerCase()))
      .slice(0, MAX_NEW_TOPICS_PER_RUN);

    for (const topic of newTopics) {
      try {
        const copy = await generateCarouselContent(topic.title);
        const images = await fetchImagesForTopic(topic.title, 5);

        const row = SHEET_COLUMNS.map((col) => {
          if (col === "trending_topic") return topic.title;
          if (col === "status") return "pendente";
          if (col === "slide1_imagem") return images[0] ?? "";
          if (col === "slide2_imagem") return images[1] ?? "";
          if (col === "slide3_imagem") return images[2] ?? "";
          if (col === "slide4_imagem") return images[3] ?? "";
          if (col === "slide5_imagem") return images[4] ?? "";
          return (copy as Record<string, string>)[col] ?? "";
        });

        await appendRow(row);
        results.push({ topic: topic.title, status: "adicionado" });
      } catch (err) {
        results.push({
          topic: topic.title,
          status: "erro",
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
