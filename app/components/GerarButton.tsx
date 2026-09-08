"use client";

import { useState } from "react";

export default function GerarButton({ rowNumber }: { rowNumber: number }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );

  async function handleClick() {
    setState("loading");
    try {
      const res = await fetch("/api/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowNumber }),
      });
      if (!res.ok) throw new Error("falhou");
      setState("done");
      // Recarrega a página pra puxar o status atualizado da planilha.
      window.location.reload();
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <button className="action" disabled>
        Marcado como gerado
      </button>
    );
  }

  return (
    <button className="action primary" onClick={handleClick} disabled={state === "loading"}>
      {state === "loading" ? "Marcando..." : "Gerar carrossel"}
    </button>
  );
}
