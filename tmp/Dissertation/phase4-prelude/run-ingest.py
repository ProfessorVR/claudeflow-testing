#!/usr/bin/env python3
"""
Phase 4.0 prelude: classify corpus/download PDFs, basic-ingest Cohort B into
ChromaDB collection `dissertation-perplexity-cache`, compute dissertation
relevance density per source.

Run-id: 2026-05-13T1439
"""
import json
import os
import re
import subprocess
import sys
import time
import uuid
from datetime import datetime
from pathlib import Path

import urllib.request
import urllib.error

DOWNLOAD_DIR = Path("/home/dalton/projects/claudeflow-testing/corpus/download")
TEXT_CACHE = DOWNLOAD_DIR / "text-cache"
INGEST_LOG_DIR = DOWNLOAD_DIR / "_ingest-logs"
OUT_DIR = Path("/home/dalton/projects/claudeflow-testing/tmp/Dissertation/phase4-prelude")
RUN_ID = "2026-05-13T1439"

EMBED_URL = "http://localhost:8000/embed"
CHROMA_BASE = "http://localhost:8001/api/v2/tenants/default_tenant/databases/default_database"
COLLECTION_NAME = "dissertation-perplexity-cache"

INGEST_LOG_DIR.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)


# -------- Classification rules --------

# Cohort A (already in corpus/index — route cache hits to Tier A; do NOT ingest)
# Map: filename -> corpus/index target directory
COHORT_A = {
    "Kevin_White_1985_The_Meaning_of_Phantasia_in_Aristotle_s_De_Anima_III_3-8.pdf":
        "corpus/index/Aristotelian Phantasia Secondary (1985-2017)/White - Phantasia in DA III.3-8 (1985)/",
    "_extra_Frede_Cogitive_Role_of_Phantasia.pdf":
        "corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Frede - Cognitive Role of Phantasia (1992)/",
}

# Cohort B (NOT in corpus/index — basic ingest required)
# Map: filename -> {author, year, title, deep_analysis_flag (★★★/★★/★/none)}
COHORT_B = {
    "Adrian_Costache_2013_Heidegger_on_Discourse_and_Idle_Talk_The_Role_of_Aristotelian_Rhetoric.pdf": {
        "author": "Costache, Adrian", "year": 2013,
        "title": "Heidegger on Discourse and Idle Talk: The Role of Aristotelian Rhetoric",
        "deep_analysis_flag": "★★",
    },
    "Corcilius_Klaus_2013_Aristotle_s_Model_of_Animal_Motion.pdf": {
        "author": "Corcilius, Klaus", "year": 2013,
        "title": "Aristotle's Model of Animal Motion",
        "deep_analysis_flag": "★★★",
    },
    "Jamie_Dow_2011_Aristotle_s_Theory_of_the_Emotions_Emotions_as_Pleasures.pdf": {
        "author": "Dow, Jamie", "year": 2011,
        "title": "Aristotle's Theory of the Emotions: Emotions as Pleasures",
        "deep_analysis_flag": "★★★",
    },
    "Katherine_Withy_2023_Heidegger_on_Being_Affected.pdf": {
        "author": "Withy, Katherine", "year": 2023,
        "title": "Heidegger on Being Affected",
        "deep_analysis_flag": "★★★",
    },
    "Lou_Agosta_2010_Heidegger_s_1924_Clearing_of_the_Affects_Using_Aristotle_s_Rhetoric_Book_II.pdf": {
        "author": "Agosta, Lou", "year": 2010,
        "title": "Heidegger's 1924 Clearing of the Affects Using Aristotle's Rhetoric Book II",
        "deep_analysis_flag": "★★★",
    },
    "Newman_Sara_2016_The_Enthymeme.pdf": {
        "author": "Newman, Sara", "year": 2016,
        "title": "The Enthymeme",
        "deep_analysis_flag": "none",  # NOT the Fredal 2020 enthymeme work; supplementary
    },
    "_extra_Aristotle_20on_20Anger_20Justice_20and_20Punishment.pdf": {
        "author": "Christensen, Justin", "year": 2016,
        "title": "Aristotle on Anger, Justice and Punishment",
        "deep_analysis_flag": "★★★",
    },
    "_extra_cartesian-theatre.pdf": {
        "author": "Caston, Victor", "year": 2021,
        "title": "Aristotle on the Cartesian Theatre",
        "deep_analysis_flag": "★★★",
    },
    "_extra_making-sense-of-heidegger-a-paradigm-shift.pdf": {
        "author": "Sheehan, Thomas", "year": 2015,
        "title": "Making Sense of Heidegger: A Paradigm Shift",
        "deep_analysis_flag": "★★",
    },
    # Below: known-author cohort B entries that are useful supplementary even
    # without being one of the 17 cache sources.
    "_extra_A_Companion_to_Rhetoric_and_Rhetorical_Citicism_By_Walter_Jost_and_Wendy_Olmsted.pdf": {
        "author": "Jost, Walter; Olmsted, Wendy (eds.)", "year": 2004,
        "title": "A Companion to Rhetoric and Rhetorical Criticism",
        "deep_analysis_flag": "none",
    },
    "Blakesley_Edward_Schiappa_2009_Elements_of_Rhetoric_and_Dramatism.pdf": {
        "author": "Blakesley, David; Schiappa, Edward (eds.)", "year": 2009,
        "title": "Elements of Rhetoric and Dramatism",
        "deep_analysis_flag": "none",
    },
    "G._R._T._Ross_1906_Aristotle_De_Insomniis_Translation_and_Notes.pdf": {
        "author": "Ross, G. R. T. (trans.)", "year": 1906,
        "title": "Aristotle: De Insomniis — Translation and Notes",
        "deep_analysis_flag": "★",  # primary-text translation; useful for §1.6 / phantasma
    },
    "John_Beare_trans._and_ed.__1908_Aristotle_on_Sleep_and_Dreams_De_Insomniis.pdf": {
        "author": "Beare, John (trans./ed.)", "year": 1908,
        "title": "Aristotle on Sleep and Dreams (De Insomniis)",
        "deep_analysis_flag": "★",
    },
}

# Cohort C (ambiguous / undecidable from filename alone)
COHORT_C = {
    "_extra_3df5ade74f241d2affff8371fffffff0.pdf": "opaque-hash filename; defer (peek at text-cache if exists)",
    "_extra_Ae_Bk_3.pdf": "likely Aristotle (Nicomachean Ethics or Rhetoric) Book 3 fragment; defer",
    "_extra_Enacting_20Virtue_20.pdf": "likely an article on virtue ethics; defer",
    "_extra_The_20Nicomachean_20Ethics.pdf": "duplicate primary text (already in corpus/index/Aristotle - Complete Works); defer",
    "_extra_c6ad8b858b5517b5da6df021a2c539a9d917.pdf": "opaque-hash filename; defer",
}


# -------- Dissertation relevance terms --------
# Carefully match patterns - terms are case-sensitive for some Greek/German;
# others use \b word boundary.
COINED_TERMS = [
    "resonant epithymia",
    "resonant pathē",
    "resonant pathe",          # ASCII variant
    "basic affective valence",
    "articulational concretion",
    "pathos simpliciter",
    "resonant orexis",
    "resonant aisthēma",
    "resonant aisthema",
    "resonant kinēsis",
    "resonant kinesis",
    "resonant aisthēsis",
    "resonant aisthesis",
]

GREEK_TERMS = [
    "pathos", "pathē", "pathe", "pathēmata", "pathemata",
    "paschein",
    "phantasia", "phantasma", "phantasmata",
    "kinēsis", "kinesis",
    "energeia",
    "dynamis",
    "aisthēsis", "aisthesis", "aisthēma", "aisthema",
    "doxa",
    "orexis", "epithymia",
    "nous",
    "hexis",
    "kritikon", "krisis",
]

HEIDEGGER_TERMS = [
    "Befindlichkeit",
    "Stimmung",
    "Dasein",
    "BCAP",
    "Bewegtheit",
    "In-der-Welt-sein",
    "Erschlossenheit",
    "Geworfenheit",
]


def count_term_hits(text: str):
    """Return dict of term -> count using \\b word boundaries (case-sensitive
    where it matters, case-insensitive for coined English phrases)."""
    hits = {}
    # Coined terms (English-leaning; case-insensitive)
    for t in COINED_TERMS:
        pat = re.compile(r"\b" + re.escape(t) + r"\b", re.IGNORECASE)
        c = len(pat.findall(text))
        if c:
            hits[t] = c
    # Greek (case-insensitive — many works italicize but case varies)
    for t in GREEK_TERMS:
        pat = re.compile(r"\b" + re.escape(t) + r"\b", re.IGNORECASE)
        c = len(pat.findall(text))
        if c:
            hits[t] = c
    # Heidegger German (case-SENSITIVE — these capitalized German nouns mean
    # something different lowercased; preserve original)
    for t in HEIDEGGER_TERMS:
        pat = re.compile(r"\b" + re.escape(t) + r"\b")
        c = len(pat.findall(text))
        if c:
            hits[t] = c
    return hits


def chunk_text(text: str, target_chars: int = 2400, overlap: int = 240):
    """Chunk text into ~500-1000 token blocks (~2400 chars ≈ 600 tokens)
    respecting paragraph/sentence boundaries where possible."""
    # Normalize: collapse \r, split on form-feeds (pdftotext page breaks)
    pages = text.split("\f")
    chunks = []
    cur_buf = []
    cur_len = 0
    cur_page_start = 1
    page_no = 0
    for page_no, page in enumerate(pages, start=1):
        # within page, split on blank-line paragraphs
        paragraphs = re.split(r"\n\s*\n", page)
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            para_len = len(para)
            if cur_len + para_len + 2 > target_chars and cur_buf:
                chunks.append({
                    "text": "\n\n".join(cur_buf),
                    "page_start": cur_page_start,
                    "page_end": page_no,
                })
                # overlap: keep tail of last para
                tail = cur_buf[-1][-overlap:] if cur_buf else ""
                cur_buf = [tail] if tail else []
                cur_len = len(tail)
                cur_page_start = page_no
            cur_buf.append(para)
            cur_len += para_len + 2
    if cur_buf:
        chunks.append({
            "text": "\n\n".join(cur_buf),
            "page_start": cur_page_start,
            "page_end": page_no if page_no else 1,
        })
    # Filter: drop chunks shorter than 200 chars (front-matter noise)
    chunks = [c for c in chunks if len(c["text"]) >= 200]
    return chunks


def post_json(url: str, payload, timeout: int = 120):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}, method="POST"
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_json(url: str, timeout: int = 30):
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def ensure_collection():
    """Make sure dissertation-perplexity-cache collection exists, return id."""
    cols = get_json(f"{CHROMA_BASE}/collections")
    for c in cols:
        if c["name"] == COLLECTION_NAME:
            return c["id"]
    # Create
    payload = {
        "name": COLLECTION_NAME,
        "configuration": {"hnsw": {"space": "cosine"}},
        "get_or_create": True,
    }
    r = post_json(f"{CHROMA_BASE}/collections", payload)
    return r["id"]


def embed_texts(texts):
    """Call /embed; returns list of embedding vectors of dim 1536."""
    # Without metadata, server stores into its default collection but also
    # returns embeddings. We pass metadata so as not to leave a leak, then
    # we'll discard the server-side storage by simply not relying on it
    # (the side-effect is unavoidable without a flag; acceptable per plan).
    resp = post_json(
        EMBED_URL,
        {"texts": texts, "metadata": [{"phase": "4.0-prelude", "discard": True}] * len(texts)},
        timeout=180,
    )
    return resp["embeddings"]


def chroma_add(collection_id, ids, embeddings, documents, metadatas):
    url = f"{CHROMA_BASE}/collections/{collection_id}/add"
    payload = {
        "ids": ids,
        "embeddings": embeddings,
        "documents": documents,
        "metadatas": metadatas,
    }
    return post_json(url, payload, timeout=180)


def ensure_text_cache(pdf_path: Path) -> Path:
    """Return path to text-cache .txt; pdftotext if missing."""
    txt_path = TEXT_CACHE / (pdf_path.stem + ".txt")
    if txt_path.exists() and txt_path.stat().st_size > 1000:
        return txt_path
    TEXT_CACHE.mkdir(parents=True, exist_ok=True)
    # Run pdftotext -layout
    print(f"  pdftotext -layout {pdf_path.name} ...")
    result = subprocess.run(
        ["pdftotext", "-layout", str(pdf_path), str(txt_path)],
        capture_output=True, text=True, timeout=300,
    )
    if result.returncode != 0:
        print(f"  pdftotext FAILED: {result.stderr[:200]}")
        return None
    return txt_path if txt_path.exists() else None


def ingest_pdf(filename, meta, collection_id, log_fh):
    """Ingest a single Cohort B PDF. Returns dict with chunk_count, density."""
    pdf_path = DOWNLOAD_DIR / filename
    if not pdf_path.exists():
        log_fh.write(f"SKIP: {filename} not on disk\n")
        return None
    txt_path = ensure_text_cache(pdf_path)
    if not txt_path:
        log_fh.write(f"SKIP: {filename} text-cache extraction failed\n")
        return None
    text = txt_path.read_text(encoding="utf-8", errors="replace")
    if len(text) < 2000:
        log_fh.write(f"SKIP: {filename} text too short ({len(text)} chars)\n")
        return None
    log_fh.write(f"text-cache: {txt_path.name} ({len(text)} chars)\n")

    # Chunk
    chunks = chunk_text(text)
    log_fh.write(f"chunks: {len(chunks)}\n")
    if not chunks:
        return None

    # Compute density
    full_hits = count_term_hits(text)
    total_term_hits = sum(full_hits.values())
    unique_terms = len(full_hits)
    density = (unique_terms * total_term_hits) / max(len(chunks), 1)
    log_fh.write(f"term-hits: unique={unique_terms}, total={total_term_hits}, density={density:.2f}\n")
    log_fh.write(f"top-terms: {sorted(full_hits.items(), key=lambda x: -x[1])[:8]}\n")

    # Embed + insert (batches of 32 to keep payloads modest)
    BATCH = 16
    all_ids = []
    inserted = 0
    for i in range(0, len(chunks), BATCH):
        batch = chunks[i:i+BATCH]
        texts = [c["text"] for c in batch]
        try:
            embs = embed_texts(texts)
        except Exception as e:
            log_fh.write(f"embed batch {i} failed: {e}\n")
            continue
        ids = [str(uuid.uuid4()) for _ in batch]
        metadatas = []
        for j, c in enumerate(batch):
            md = {
                "source_pdf_filename": filename,
                "author": meta["author"],
                "year": int(meta["year"]),
                "title": meta["title"],
                "page_start": int(c["page_start"]),
                "page_end": int(c["page_end"]),
                "chunk_index": i + j,
                "phase": "4.0-prelude",
                "run_id": RUN_ID,
                "deep_analysis_flag": meta.get("deep_analysis_flag", "none"),
            }
            metadatas.append(md)
        try:
            chroma_add(collection_id, ids, embs, texts, metadatas)
        except Exception as e:
            log_fh.write(f"chroma add batch {i} failed: {e}\n")
            continue
        all_ids.extend(ids)
        inserted += len(batch)
        log_fh.write(f"  batch {i//BATCH}: inserted {len(batch)}\n")
    log_fh.write(f"INSERTED total: {inserted} / {len(chunks)} chunks\n")

    return {
        "filename": filename,
        "author": meta["author"],
        "year": meta["year"],
        "title": meta["title"],
        "chunks_total": len(chunks),
        "chunks_inserted": inserted,
        "unique_terms": unique_terms,
        "total_term_hits": total_term_hits,
        "density": round(density, 3),
        "top_terms": dict(sorted(full_hits.items(), key=lambda x: -x[1])[:10]),
        "deep_analysis_flag": meta.get("deep_analysis_flag", "none"),
        "chunk_ids": all_ids,
    }


def main():
    print(f"[{datetime.now().isoformat(timespec='seconds')}] Phase 4.0 prelude ingest")

    # 4.0.2 — verify services
    try:
        embed_status = get_json("http://localhost:8000/")
        print(f"Embedding service: {embed_status.get('status')} {embed_status.get('model','')}")
    except Exception as e:
        print(f"Embedding service unavailable: {e}")
        return 1
    try:
        hb = get_json("http://localhost:8001/api/v2/heartbeat")
        print(f"ChromaDB heartbeat: {hb}")
    except Exception as e:
        print(f"ChromaDB unavailable: {e}")
        return 1

    collection_id = ensure_collection()
    print(f"Collection {COLLECTION_NAME} id={collection_id}")

    # 4.0.1 classification
    classification = {"A": [], "B": [], "C": []}
    pdfs = sorted([p.name for p in DOWNLOAD_DIR.glob("*.pdf")])
    for fn in pdfs:
        if fn in COHORT_A:
            classification["A"].append({"filename": fn, "corpus_index_target": COHORT_A[fn]})
        elif fn in COHORT_B:
            classification["B"].append({"filename": fn, **COHORT_B[fn]})
        else:
            note = COHORT_C.get(fn, "uncategorized; defer")
            classification["C"].append({"filename": fn, "note": note})

    print(f"Classification: A={len(classification['A'])}, "
          f"B={len(classification['B'])}, C={len(classification['C'])}")

    # 4.0.3 ingest Cohort B
    ingest_results = []
    for entry in classification["B"]:
        fn = entry["filename"]
        meta = {k: entry[k] for k in ("author", "year", "title", "deep_analysis_flag")}
        log_path = INGEST_LOG_DIR / f"{Path(fn).stem}-{RUN_ID}.log"
        print(f"\n>>> Ingesting {fn}")
        with open(log_path, "w") as log_fh:
            log_fh.write(f"start: {datetime.now().isoformat(timespec='seconds')}\n")
            log_fh.write(f"pdf: {fn}\nmeta: {json.dumps(meta)}\n")
            t0 = time.time()
            try:
                r = ingest_pdf(fn, meta, collection_id, log_fh)
            except Exception as e:
                log_fh.write(f"FATAL: {e}\n")
                r = None
            log_fh.write(f"elapsed: {time.time()-t0:.1f}s\n")
            log_fh.write(f"end: {datetime.now().isoformat(timespec='seconds')}\n")
        if r:
            r["log_file"] = str(log_path)
            ingest_results.append(r)
            print(f"    chunks={r['chunks_inserted']}/{r['chunks_total']} "
                  f"density={r['density']} flag={r['deep_analysis_flag']}")

    # 4.0.4 density rankings
    ranked = sorted(ingest_results, key=lambda r: -r["density"])
    threshold_idx = max(1, int(len(ranked) * 0.30))
    top_candidates = ranked[:threshold_idx + 1]  # generous top-30%+1

    # 4.0.5 emit summaries
    summary = {
        "phase": "4.0-prelude",
        "run_id": RUN_ID,
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "services": {
            "embedding": "running (http://localhost:8000)",
            "chromadb": "running (http://localhost:8001)",
        },
        "collection": {
            "name": COLLECTION_NAME,
            "id": collection_id,
        },
        "classification": classification,
        "cohort_counts": {
            "A_skip_already_indexed": len(classification["A"]),
            "B_basic_ingest": len(classification["B"]),
            "C_deferred_ambiguous": len(classification["C"]),
        },
        "ingest_results": ingest_results,
        "density_ranking_top_30pct": [
            {"filename": r["filename"], "density": r["density"],
             "flag": r["deep_analysis_flag"]}
            for r in top_candidates
        ],
    }

    out_json = OUT_DIR / "phase4-0-ingest-summary.json"
    out_json.write_text(json.dumps(summary, indent=2, ensure_ascii=False))
    print(f"\nWrote {out_json}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
