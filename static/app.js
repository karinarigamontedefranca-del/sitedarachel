// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------
let currentTopic = null;
let currentSlides = []; // roteiro vindo da IA, com image_ref/image_url adicionados
let activeSlideIndex = null; // qual slide o modal de foto está editando

const PALETTE = ["#302421", "#c9a09c", "#302421", "#f6f1ec", "#c9a09c", "#302421", "#c9a09c"];

const el = (id) => document.getElementById(id);

function goToStep(n) {
  [1, 2, 3].forEach((s) => el(`step-${s}`).classList.toggle("hidden", s !== n));
  document.querySelectorAll(".step").forEach((s) => {
    s.classList.toggle("active", Number(s.dataset.step) === n);
  });
}

// ---------------------------------------------------------------------------
// STEP 1 — Temas em alta
// ---------------------------------------------------------------------------
async function loadTrending() {
  el("trending-loading").classList.remove("hidden");
  try {
    const res = await fetch("/api/trending");
    const topics = await res.json();
    const list = el("trending-list");
    list.innerHTML = "";
    if (!topics.length) {
      list.innerHTML = "<p>Não foi possível buscar temas agora. Verifique a chave ANTHROPIC_API_KEY no servidor.</p>";
    }
    topics.forEach((t) => {
      const card = document.createElement("button");
      card.className = "topic-card";
      card.innerHTML = `<h3>${t.title}</h3><p>${t.hook}</p>`;
      card.onclick = () => selectTopic(t);
      list.appendChild(card);
    });
  } catch (e) {
    el("trending-list").innerHTML = "<p>Erro ao buscar temas.</p>";
  }
  el("trending-loading").classList.add("hidden");
}

// ---------------------------------------------------------------------------
// STEP 2 — Roteiro + escolha de foto por slide
// ---------------------------------------------------------------------------
async function selectTopic(topic) {
  currentTopic = topic;
  el("topic-title").textContent = topic.title;
  goToStep(2);
  el("script-loading").classList.remove("hidden");
  el("slides-editor").innerHTML = "";
  el("to-preview-btn").classList.add("hidden");

  const res = await fetch("/api/script", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(topic),
  });
  const data = await res.json();
  currentSlides = (data.slides || []).map((s) => ({ ...s, image_ref: null, image_preview: null }));

  renderSlidesEditor();
  el("script-loading").classList.add("hidden");
  el("to-preview-btn").classList.remove("hidden");
}

function renderSlidesEditor() {
  const container = el("slides-editor");
  container.innerHTML = "";
  currentSlides.forEach((slide, i) => {
    const row = document.createElement("div");
    row.className = "slide-row";
    row.innerHTML = `
      <div class="thumb-picker" data-index="${i}">
        ${slide.image_preview ? `<img src="${slide.image_preview}" />` : (slide.wants_photo ? "Escolher foto" : "Sem foto (cor da marca)")}
      </div>
      <div class="slide-info">
        <div class="headline">"${slide.headline || ""}"</div>
        <div class="meta">Slide ${i + 1} ${slide.wants_photo ? "· sugerido para ter foto" : "· fundo de cor"}</div>
      </div>
    `;
    row.querySelector(".thumb-picker").onclick = () => openPhotoModal(i);
    container.appendChild(row);
  });
}

// ---------------------------------------------------------------------------
// Modal de foto: upload / biblioteca / sugestão
// ---------------------------------------------------------------------------
function openPhotoModal(index) {
  activeSlideIndex = index;
  el("photo-modal").classList.remove("hidden");
  switchTab("upload");
  loadLibrary();
  const query = currentSlides[index].photo_query || currentSlides[index].headline;
  el("suggest-query-hint").textContent = `Sugestões para: "${query}"`;
  loadSuggestions(query);
}

function closePhotoModal() {
  el("photo-modal").classList.add("hidden");
  activeSlideIndex = null;
}

function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("hidden", p.id !== `tab-${tab}`));
}

async function loadLibrary() {
  const res = await fetch("/api/library");
  const items = await res.json();
  const grid = el("library-grid");
  grid.innerHTML = items.length
    ? ""
    : "<p class='hint'>Você ainda não enviou nenhuma foto.</p>";
  items.forEach((item) => {
    const img = document.createElement("img");
    img.src = item.url;
    img.onclick = () => choosePhoto(item.url);
    grid.appendChild(img);
  });
}

async function loadSuggestions(query) {
  const grid = el("suggest-grid");
  grid.innerHTML = "<p class='hint'>Carregando sugestões...</p>";
  try {
    const res = await fetch(`/api/suggest-photos?query=${encodeURIComponent(query)}`);
    const items = await res.json();
    grid.innerHTML = items.length
      ? ""
      : "<p class='hint'>Nenhuma sugestão disponível (verifique a chave UNSPLASH_ACCESS_KEY, ou envie sua própria foto).</p>";
    items.forEach((item) => {
      const img = document.createElement("img");
      img.src = item.thumb;
      img.title = `Foto por ${item.credit} (Unsplash)`;
      img.onclick = () => choosePhoto(item.full);
      grid.appendChild(img);
    });
  } catch (e) {
    grid.innerHTML = "<p class='hint'>Erro ao buscar sugestões.</p>";
  }
}

function choosePhoto(url) {
  if (activeSlideIndex === null) return;
  currentSlides[activeSlideIndex].image_ref = url;
  currentSlides[activeSlideIndex].image_preview = url;
  renderSlidesEditor();
  closePhotoModal();
}

async function handleUpload(file) {
  const status = el("upload-status");
  status.textContent = "Enviando...";
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (data.url) {
      choosePhoto(data.url);
    } else {
      status.textContent = "Erro: " + (data.error || "não foi possível enviar.");
    }
  } catch (e) {
    status.textContent = "Erro ao enviar a imagem.";
  }
}

// ---------------------------------------------------------------------------
// STEP 3 — Prévia + geração final
// ---------------------------------------------------------------------------
function renderPreview() {
  const grid = el("preview-grid");
  grid.innerHTML = "";
  currentSlides.forEach((slide, i) => {
    const div = document.createElement("div");
    const hasPhoto = !!slide.image_preview;
    const bg = PALETTE[i % PALETTE.length];
    const isCream = bg === "#f6f1ec";
    div.className = `preview-slide ${hasPhoto ? "" : "no-photo"} ${!hasPhoto && isCream ? "on-cream" : ""}`;
    div.style.background = hasPhoto ? `url('${slide.image_preview}') center/cover` : bg;
    div.innerHTML = `
      <div class="p-handle"><b>@Rachel</b>_Patrocinio</div>
      <div class="p-text">
        ${slide.eyebrow ? `<div class="p-eyebrow">${slide.eyebrow.toUpperCase()}</div>` : ""}
        <div class="p-headline">${slide.headline || ""}</div>
      </div>
    `;
    grid.appendChild(div);
  });
}

async function generateFinal() {
  el("final-loading").classList.remove("hidden");
  el("final-grid").innerHTML = "";
  el("generate-final-btn").disabled = true;

  const res = await fetch("/api/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slides: currentSlides }),
  });
  const data = await res.json();
  const grid = el("final-grid");
  (data.slides || []).forEach((url, i) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `<img src="${url}" style="width:100%;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,0.12);" />
      <a href="${url}" download style="display:block;text-align:center;margin-top:6px;font-size:13px;">Baixar slide ${i + 1}</a>`;
    grid.appendChild(wrap);
  });

  el("final-loading").classList.add("hidden");
  el("generate-final-btn").disabled = false;
  el("restart-btn").classList.remove("hidden");
}

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------
el("to-preview-btn").onclick = () => {
  renderPreview();
  goToStep(3);
};
el("back-to-photos-btn").onclick = () => goToStep(2);
el("generate-final-btn").onclick = generateFinal;
el("restart-btn").onclick = () => location.reload();
el("modal-close").onclick = closePhotoModal;
document.querySelectorAll(".tab-btn").forEach((b) => (b.onclick = () => switchTab(b.dataset.tab)));
el("upload-input").onchange = (e) => {
  if (e.target.files[0]) handleUpload(e.target.files[0]);
};

loadTrending();
