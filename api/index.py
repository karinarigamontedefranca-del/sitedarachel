"""
Rachel Patrocínio - Gerador de Posts (versão Vercel)
======================================================
Igual à versão anterior, mas adaptada para rodar como função serverless na
Vercel: como a Vercel não mantém uma pasta de arquivos permanente entre uma
chamada e outra, as fotos (enviadas por upload e as artes finais geradas) são
guardadas no VERCEL BLOB — o armazenamento de arquivo da própria Vercel.

Variáveis de ambiente necessárias (configurar em Vercel → Project → Settings → Environment Variables):
  ANTHROPIC_API_KEY    -> https://platform.claude.com
  UNSPLASH_ACCESS_KEY  -> https://unsplash.com/developers (opcional)
  BLOB_READ_WRITE_TOKEN -> criado automaticamente ao ativar o Blob Storage
                           dentro do próprio projeto na Vercel
                           (Project -> Storage -> Create Database -> Blob)
"""

import os
import io
import json
import uuid
import requests
import vercel_blob
from flask import Flask, request, jsonify, send_from_directory
from PIL import Image, ImageDraw, ImageFont

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
UNSPLASH_ACCESS_KEY = os.environ.get("UNSPLASH_ACCESS_KEY", "")
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS_DIR = os.path.join(BASE_DIR, "public", "fonts")
PUBLIC_DIR = os.path.join(BASE_DIR, "public")

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Identidade de marca (Manual de Marca — Rachel Patrocínio)
# ---------------------------------------------------------------------------
W, H = 1080, 1350
BROWN_DEEP = (48, 36, 33)
ROSE = (201, 160, 156)
CREAM = (241, 235, 227)
WHITE = (255, 255, 255)
PALETTE_CYCLE = [BROWN_DEEP, ROSE, BROWN_DEEP, CREAM, ROSE, BROWN_DEEP, ROSE]


def playfair(size, style="Italic"):
    path = os.path.join(FONTS_DIR, f"PlayfairDisplay-{'Italic' if 'Italic' in style else 'Regular'}.ttf")
    f = ImageFont.truetype(path, size)
    try:
        f.set_variation_by_name(style)
    except Exception:
        pass
    return f


def montserrat(size, weight="Regular"):
    f = ImageFont.truetype(os.path.join(FONTS_DIR, "Montserrat-Regular.ttf"), size)
    try:
        f.set_variation_by_name(weight)
    except Exception:
        pass
    return f


def wrap_text(draw, text, font, max_width):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if draw.textlength(test, font=font) <= max_width:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def draw_lines(draw, lines, font, x, y, fill, line_h):
    cy = y
    for ln in lines:
        draw.text((x, cy), ln, font=font, fill=fill)
        cy += line_h
    return cy


def draw_handle(draw, color=WHITE):
    f_bold = montserrat(30, "Bold")
    f_reg = montserrat(30, "Regular")
    w1 = draw.textlength("@Rachel", font=f_bold)
    w2 = draw.textlength("_Patrocinio", font=f_reg)
    x = (W - (w1 + w2)) / 2
    draw.text((x, 64), "@Rachel", font=f_bold, fill=color)
    draw.text((x + w1, 64), "_Patrocinio", font=f_reg, fill=color)


def resolve_image(image_ref):
    """image_ref é sempre uma URL http(s) nessa versão (Blob público ou Unsplash)."""
    if not image_ref:
        return None
    try:
        r = requests.get(image_ref, timeout=15)
        r.raise_for_status()
        return Image.open(io.BytesIO(r.content)).convert("RGB")
    except Exception as e:
        print("resolve_image error:", e)
        return None


def build_slide(slide, index, image_ref=None):
    bg_color = PALETTE_CYCLE[index % len(PALETTE_CYCLE)]
    photo = resolve_image(image_ref)

    if photo:
        src_ratio = photo.width / photo.height
        dst_ratio = W / H
        if src_ratio > dst_ratio:
            new_h, new_w = H, int(H * src_ratio)
        else:
            new_w, new_h = W, int(W / src_ratio)
        photo = photo.resize((new_w, new_h))
        left, top = (new_w - W) // 2, (new_h - H) // 2
        img = photo.crop((left, top, left + W, top + H))
        gradient = Image.new("L", (1, H), color=0)
        for y in range(H):
            gradient.putpixel((0, y), int(255 * max(0, (y - H * 0.32) / (H * 0.68))))
        gradient = gradient.resize((W, H))
        black = Image.new("RGB", (W, H), (0, 0, 0))
        img = Image.composite(black, img, gradient.point(lambda p: int(p * 0.78)))
        text_color = WHITE
    else:
        img = Image.new("RGB", (W, H), bg_color)
        text_color = WHITE if bg_color != CREAM else BROWN_DEEP

    d = ImageDraw.Draw(img)
    draw_handle(d, color=WHITE if photo else (WHITE if bg_color != CREAM else BROWN_DEEP))

    y = 980
    if slide.get("eyebrow"):
        d.text((80, y - 60), slide["eyebrow"].upper(), font=montserrat(28, "SemiBold"), fill=ROSE)
    if slide.get("small_text"):
        d.text((80, y - 20), slide["small_text"], font=montserrat(34, "Regular"), fill=text_color)
        y += 60

    headline_f = playfair(72, "SemiBold Italic")
    lines = wrap_text(d, slide.get("headline", ""), headline_f, 900)
    y = draw_lines(d, lines, headline_f, 80, y, text_color, 82)

    if slide.get("list_items"):
        list_f = montserrat(34, "Medium")
        y += 20
        for item in slide["list_items"]:
            wrapped = wrap_text(d, item, list_f, 900)
            y = draw_lines(d, wrapped, list_f, 80, y, text_color, 46)
            y += 16
    return img


def call_claude(messages, tools=None, max_tokens=1800):
    payload = {"model": ANTHROPIC_MODEL, "max_tokens": max_tokens, "messages": messages}
    if tools:
        payload["tools"] = tools
    r = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={"x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"},
        json=payload, timeout=55,
    )
    r.raise_for_status()
    return r.json()


def extract_json(data):
    text_blocks = [b["text"] for b in data.get("content", []) if b.get("type") == "text"]
    raw = "\n".join(text_blocks).strip().replace("```json", "").replace("```", "").strip()
    return json.loads(raw)


# ---------------------------------------------------------------------------
# Rotas
# ---------------------------------------------------------------------------

@app.route("/api/trending", methods=["GET"])
def api_trending():
    data = call_claude(
        messages=[{"role": "user", "content": (
            "Busque na web assuntos em alta AGORA no Brasil relacionados a marketing, "
            "branding, marcas ou cultura pop, que sirvam de gancho para um post educativo "
            "sobre branding pessoal e de marca. Responda APENAS com JSON válido: "
            '[{"title":"...", "hook":"..."}] com 6 itens.'
        )}],
        tools=[{"type": "web_search_20250305", "name": "web_search"}],
    )
    try:
        return jsonify(extract_json(data))
    except Exception:
        return jsonify([])


@app.route("/api/script", methods=["POST"])
def api_script():
    body = request.get_json(force=True)
    prompt = f"""
Você escreve os posts em carrossel de Instagram da Rachel Patrocínio, consultora de
branding. Tom de voz: frases curtas, editoriais, português do Brasil correto
(sempre "o Instagram", nunca "a Instagram").

Tema: "{body.get('title','')}" — {body.get('hook','')}

Escreva um roteiro de 7 slides sobre branding pessoal e de marca usando esse tema
como gancho. Responda APENAS com JSON: lista de 7 objetos com os campos:
  "eyebrow" (opcional, só slide 1, maiúsculas curtas)
  "small_text" (opcional, frase curta de contexto)
  "headline" (obrigatório, até 12 palavras, tom afirmativo)
  "list_items" (opcional, 2-3 itens curtos, use no máx 1 slide)
  "wants_photo": true/false — true só nos 2-3 slides mais "visuais/de abertura"
  "photo_query": 2-4 palavras-chave em inglês (só se wants_photo=true), sempre
     conceitos genéricos (mãos, telas, texturas, objetos) — nunca pessoas famosas
     nem marcas registradas.
O último slide é o fechamento, curto, sem lista.
"""
    data = call_claude(messages=[{"role": "user", "content": prompt}])
    slides = extract_json(data)
    return jsonify({"slides": slides})


@app.route("/api/suggest-photos", methods=["GET"])
def api_suggest_photos():
    query = request.args.get("query", "")
    if not UNSPLASH_ACCESS_KEY or not query:
        return jsonify([])
    try:
        r = requests.get(
            "https://api.unsplash.com/search/photos",
            params={"query": query, "orientation": "portrait", "per_page": 6},
            headers={"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"},
            timeout=10,
        )
        r.raise_for_status()
        results = r.json().get("results", [])
        return jsonify([
            {"thumb": p["urls"]["thumb"], "full": p["urls"]["regular"], "credit": p["user"]["name"]}
            for p in results
        ])
    except Exception as e:
        print("suggest-photos error:", e)
        return jsonify([])


@app.route("/api/upload", methods=["POST"])
def api_upload():
    if "file" not in request.files:
        return jsonify({"error": "sem arquivo"}), 400
    file = request.files["file"]
    ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    if ext not in (".jpg", ".jpeg", ".png", ".webp"):
        return jsonify({"error": "formato não suportado"}), 400
    fname = f"uploads/{uuid.uuid4().hex}{ext}"
    result = vercel_blob.put(fname, file.read())
    return jsonify({"id": fname, "url": result["url"]})


@app.route("/api/library", methods=["GET"])
def api_library():
    try:
        result = vercel_blob.list({"prefix": "uploads/", "limit": "100"})
        items = [{"id": b["pathname"], "url": b["url"]} for b in result.get("blobs", [])]
        items.reverse()
        return jsonify(items)
    except Exception as e:
        print("library error:", e)
        return jsonify([])


@app.route("/api/render", methods=["POST"])
def api_render():
    body = request.get_json(force=True)
    slides = body.get("slides", [])
    post_id = uuid.uuid4().hex[:8]

    urls = []
    for i, slide in enumerate(slides):
        img = build_slide(slide, i, image_ref=slide.get("image_ref"))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=95)
        buf.seek(0)
        result = vercel_blob.put(f"generated/{post_id}/slide_{i+1:02d}.jpg", buf.read())
        urls.append(result["url"])
    return jsonify({"post_id": post_id, "slides": urls})


@app.route("/api/debug")
def api_debug():
    """Rota de diagnóstico: mostra o que o servidor está enxergando de arquivos."""
    info = {
        "base_dir": BASE_DIR,
        "public_dir": PUBLIC_DIR,
        "public_dir_exists": os.path.exists(PUBLIC_DIR),
        "base_dir_contents": os.listdir(BASE_DIR) if os.path.exists(BASE_DIR) else None,
        "public_dir_contents": os.listdir(PUBLIC_DIR) if os.path.exists(PUBLIC_DIR) else None,
        "env_vars_set": {
            "ANTHROPIC_API_KEY": bool(ANTHROPIC_API_KEY),
            "UNSPLASH_ACCESS_KEY": bool(UNSPLASH_ACCESS_KEY),
            "BLOB_READ_WRITE_TOKEN": bool(os.environ.get("BLOB_READ_WRITE_TOKEN")),
        },
    }
    return jsonify(info)


@app.route("/")
def index():
    return send_from_directory(PUBLIC_DIR, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(PUBLIC_DIR, filename)


# A Vercel importa a variável `app` diretamente deste arquivo (WSGI).
# O bloco abaixo só roda se você executar `python api/index.py` na sua máquina,
# pra testar localmente antes de subir — a Vercel nunca executa esse bloco.
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
