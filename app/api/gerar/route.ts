import { NextRequest, NextResponse } from "next/server";
import { markAsGerado } from "../../../lib/data";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rowNumber = body?.rowNumber;

  if (!rowNumber || typeof rowNumber !== "number") {
    return NextResponse.json(
      { error: "rowNumber inválido." },
      { status: 400 }
    );
  }

  try {
    await markAsGerado(rowNumber);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Não foi possível atualizar a planilha." },
      { status: 500 }
    );
  }
}
