import { getTopics, Topic } from "../lib/data";
import GerarButton from "./components/GerarButton";

export const dynamic = "force-dynamic";

function formatDate() {
  const d = new Date();
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function Pill({ status }: { status: string }) {
  if (status === "gerado") {
    return <span className="pill pill-gerado">gerado</span>;
  }
  if (status === "exemplo") {
    return <span className="pill pill-alta">exemplo</span>;
  }
  return <span className="pill pill-pendente">pendente</span>;
}

export default async function Page() {
  let topics: Topic[] = [];
  let loadError: string | null = null;

  try {
    topics = await getTopics();
  } catch (err) {
    loadError =
      err instanceof Error
        ? err.message
        : "Não foi possível ler a planilha.";
  }

  if (loadError) {
    return (
      <div className="wrap">
        <header className="masthead">
          <div>
            <h1 className="masthead-title">Rachel Patrocínio</h1>
            <p className="masthead-sub">Painel de tópicos e carrosséis</p>
          </div>
        </header>
        <p className="empty">
          Não deu pra carregar a planilha agora. Detalhe técnico: {loadError}
        </p>
      </div>
    );
  }

  const gerados = topics.filter((t) => t.status === "gerado");
  const pendentes = topics.filter((t) => t.status !== "gerado");

  return (
    <div className="wrap">
      <header className="masthead">
        <div>
          <h1 className="masthead-title">Rachel Patrocínio</h1>
          <p className="masthead-sub">Painel de tópicos e carrosséis</p>
        </div>
        <div className="masthead-date">{formatDate()}</div>
      </header>

      <p className="section-label">Prontos para revisar</p>
      <h2 className="section-count">{pendentes.length} tópicos em alta</h2>

      {pendentes.length === 0 && (
        <p className="empty">Nenhum tópico novo por enquanto.</p>
      )}

      {pendentes.map((topic) => (
        <div className="entry" key={topic.rowNumber}>
          <div>
            <p className="entry-topic">
              {topic.slide1_titulo || topic.trending_topic}
            </p>
            <div className="entry-meta">
              <Pill status={topic.status} />
              <span>{topic.trending_topic}</span>
            </div>
          </div>
          <div className="entry-actions">
            <GerarButton rowNumber={topic.rowNumber} />
          </div>
        </div>
      ))}

      <p className="section-label">Publicados</p>
      <h2 className="section-count">{gerados.length} esta semana</h2>

      {gerados.length === 0 && (
        <p className="empty">Nada publicado ainda esta semana.</p>
      )}

      {gerados.map((topic) => (
        <div className="entry" key={topic.rowNumber}>
          <div>
            <p className="entry-topic">{topic.slide1_titulo}</p>
            <div className="entry-meta">
              <Pill status={topic.status} />
              <span>{topic.trending_topic}</span>
            </div>
          </div>
        </div>
      ))}

      <p className="footer-note">
        Os tópicos em alta vêm do Google Trends e são atualizados
        automaticamente toda semana. Este painel lê e escreve na mesma
        planilha usada pelo Bulk Create do Canva.
      </p>
    </div>
  );
}
