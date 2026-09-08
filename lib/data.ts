import { readSheetRows, updateStatusCell } from "./sheets";

export type Topic = {
  rowNumber: number;
  trending_topic: string;
  status: string;
  slide1_titulo: string;
};

export async function getTopics(): Promise<Topic[]> {
  const rows = await readSheetRows();
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.trim());
  const idx = (name: string) => headers.indexOf(name);

  const iTopic = idx("trending_topic");
  const iStatus = idx("status");
  const iSlide1 = idx("slide1_titulo");

  const topics: Topic[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((cell) => !cell)) continue;

    const trending_topic = row[iTopic] ?? "";
    if (!trending_topic) continue;

    topics.push({
      rowNumber: r + 1, // +1 porque a planilha é 1-indexada e a linha 1 é o cabeçalho
      trending_topic,
      status: (row[iStatus] ?? "pendente").trim(),
      slide1_titulo: row[iSlide1] ?? "",
    });
  }

  return topics;
}

export async function markAsGerado(rowNumber: number): Promise<void> {
  await updateStatusCell(rowNumber, "gerado");
}
