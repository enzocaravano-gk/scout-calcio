#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ETL SCOUTING — unifica le fonti in un solo file pulito
======================================================
Legge:
  1. PlayerElo   (giocatori/players-selected-columns.csv)      -> elo, rank
  2. Transfermarkt (giocatori/seriec primavera/transfermarkt-datasets/)
       - players.csv          anagrafica, valore, contratto, squadra, lega
       - competitions.csv     nome lega (non serve, players ha gia' la lega)
       - appearances.csv.gz   statistiche partita -> aggrego per stagione

Fa i JOIN qui, una volta sola, e scrive UN file:
       scouting/giocatori.json

L'app HTML legge solo quel file: niente merge nel browser, niente bug.

USO:  python3 etl.py
"""

import csv, gzip, json, sys, unicodedata, datetime
from pathlib import Path
from collections import defaultdict

# ---- percorsi -------------------------------------------------------------
DESKTOP = Path(__file__).resolve().parent.parent          # /Users/enzo/Desktop
ELO_CSV = DESKTOP / "giocatori" / "players-selected-columns.csv"
TM_DIR  = DESKTOP / "giocatori" / "seriec primavera" / "transfermarkt-datasets"
TM_PLAYERS = TM_DIR / "players.csv"
TM_APPS    = TM_DIR / "appearances.csv.gz"
OUT_JSON   = Path(__file__).resolve().parent / "giocatori.json"
OUT_JS     = Path(__file__).resolve().parent / "giocatori.js"

# ---- quali campionati teniamo --------------------------------------------
# PlayerElo usa "Serie A" (=Italia), "Italy Serie B"
ELO_LEAGUES = {"Serie A": "Serie A", "Italy Serie B": "Serie B"}
# Transfermarkt: IT1 = Serie A (unico italiano presente nel dataset)
TM_LEAGUES = {"IT1": "Serie A"}
# consideriamo "attivo" chi ha giocato dalla stagione 2024 in poi
STAGIONE_MIN = 2024

csv.field_size_limit(min(sys.maxsize, 2**31 - 1))

# ---- utility --------------------------------------------------------------
def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s)
                   if unicodedata.category(c) != "Mn")

def norm(s: str) -> str:
    return strip_accents((s or "").lower()).replace(".", " ").replace("-", " ").strip()

def match_key(nome: str):
    """Chiave di match: (iniziale nome, cognome). Robusta a 'M. Akanji' vs 'Manuel Akanji'."""
    parts = [p for p in norm(nome).split() if p]
    if not parts:
        return None
    cognome = parts[-1]
    iniziale = parts[0][0] if parts[0] else ""
    return (iniziale, cognome)

def mappa_ruolo(position: str, sub: str = "") -> str:
    p = (position or "").lower() + " " + (sub or "").lower()
    if "goalkeep" in p or "portiere" in p:            return "GK"
    if "defen" in p or "back" in p:                   return "DF"
    if "midfield" in p or "centrocamp" in p:          return "MF"
    if "attack" in p or "forward" in p or "wing" in p or "striker" in p: return "FW"
    # PlayerElo usa Defender/Midfielder/Attacker/Goalkeeper -> gia' coperti sopra
    return ""

def to_int(v):
    try:    return int(float(v))
    except (TypeError, ValueError): return None

def eta_da_data(d):
    if not d:
        return None
    d = str(d)[:10]
    try:
        nasc = datetime.date.fromisoformat(d)
    except ValueError:
        return None
    oggi = datetime.date.today()
    return oggi.year - nasc.year - ((oggi.month, oggi.day) < (nasc.month, nasc.day))

# ---------------------------------------------------------------------------
# 1) PlayerElo -> dizionario per match_key  {key: {elo, rank, ...}}
# ---------------------------------------------------------------------------
def carica_elo():
    per_key = {}
    righe = []
    with open(ELO_CSV, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            lega_raw = (row.get("current_league") or "").strip()
            if lega_raw not in ELO_LEAGUES:
                continue
            rec = {
                "player_id": row.get("player_id"),
                "nome": (row.get("player_name") or "").strip(),
                "squadra": (row.get("current_team") or "").strip(),
                "campionato": ELO_LEAGUES[lega_raw],
                "nazionalita": (row.get("nationality") or "").strip(),
                "ruolo": mappa_ruolo(row.get("position")),
                "elo": (lambda x: round(x, 1) if x is not None else None)(
                        (lambda v: float(v) if v not in (None, "") else None)(row.get("elo"))),
                "rank": to_int(row.get("current_rank")),
            }
            righe.append(rec)
            k = match_key(rec["nome"])
            if k:
                # chiave per campionato: un Serie A si abbina solo a un Serie A
                per_key.setdefault((rec["campionato"], *k), rec)
    return righe, per_key

# ---------------------------------------------------------------------------
# 2) Appearances -> statistiche stagione corrente per player_id
# ---------------------------------------------------------------------------
def carica_statistiche():
    stats = defaultdict(lambda: {"partite": 0, "gol": 0, "assist": 0, "minuti": 0})
    soglia = f"{STAGIONE_MIN}-07-01"
    with gzip.open(TM_APPS, "rt", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row.get("competition_id") != "IT1":
                continue
            if (row.get("date") or "") < soglia:
                continue
            pid = row.get("player_id")
            s = stats[pid]
            s["partite"] += 1
            s["gol"]    += to_int(row.get("goals")) or 0
            s["assist"] += to_int(row.get("assists")) or 0
            s["minuti"] += to_int(row.get("minutes_played")) or 0
    return stats

# ---------------------------------------------------------------------------
# 3) Transfermarkt players -> record base (Serie A), arricchiti con elo + stats
# ---------------------------------------------------------------------------
def costruisci(elo_per_key, stats):
    giocatori = []
    usati_elo = set()
    with open(TM_PLAYERS, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            comp = row.get("current_club_domestic_competition_id")
            if comp not in TM_LEAGUES:
                continue
            if (to_int(row.get("last_season")) or 0) < STAGIONE_MIN:
                continue                       # scarta ritirati / vecchi
            nome = (row.get("name") or "").strip()
            k = match_key(nome)
            elo = elo_per_key.get((TM_LEAGUES[comp], *k)) if k else None
            k = (TM_LEAGUES[comp], *k) if k else None
            if elo:
                usati_elo.add(k)
            pid = row.get("player_id")
            st = stats.get(pid, {})
            giocatori.append({
                "id": f"tm_{pid}",
                "nome": nome,
                "eta": eta_da_data(row.get("date_of_birth")),
                "data_nascita": (row.get("date_of_birth") or "")[:10] or None,
                "ruolo": mappa_ruolo(row.get("position"), row.get("sub_position")),
                "ruolo_dettaglio": (row.get("sub_position") or "").strip() or None,
                "squadra": (row.get("current_club_name") or "").strip() or None,
                "campionato": TM_LEAGUES[comp],
                "nazionalita": (row.get("country_of_citizenship") or "").strip() or None,
                "piede": (row.get("foot") or "").strip() or None,
                "altezza": to_int(row.get("height_in_cm")),
                "valore_eur": to_int(row.get("market_value_in_eur")),
                "scadenza": (row.get("contract_expiration_date") or "")[:10] or None,
                "elo":  elo["elo"]  if elo else None,
                "rank": elo["rank"] if elo else None,
                "partite": st.get("partite"),
                "gol":     st.get("gol"),
                "assist":  st.get("assist"),
                "minuti":  st.get("minuti"),
                "url_tm": (row.get("url") or "").strip() or None,
                "fonti": ["transfermarkt"] + (["playerelo"] if elo else []),
            })
    return giocatori, usati_elo

# ---------------------------------------------------------------------------
# 4) Serie B (e altri Elo non abbinati): solo dati PlayerElo
# ---------------------------------------------------------------------------
def aggiungi_solo_elo(elo_righe, usati_elo):
    extra = []
    for rec in elo_righe:
        k = match_key(rec["nome"])
        if k and (rec["campionato"], *k) in usati_elo:
            continue              # gia' unito a un record Transfermarkt
        extra.append({
            "id": f"elo_{rec['player_id']}",
            "nome": rec["nome"],
            "eta": None, "data_nascita": None,
            "ruolo": rec["ruolo"], "ruolo_dettaglio": None,
            "squadra": rec["squadra"] or None,
            "campionato": rec["campionato"],
            "nazionalita": rec["nazionalita"] or None,
            "piede": None, "altezza": None,
            "valore_eur": None, "scadenza": None,
            "elo": rec["elo"], "rank": rec["rank"],
            "partite": None, "gol": None, "assist": None, "minuti": None,
            "url_tm": None,
            "fonti": ["playerelo"],
        })
    return extra

# ---------------------------------------------------------------------------
def main():
    for p in (ELO_CSV, TM_PLAYERS, TM_APPS):
        if not p.exists():
            sys.exit(f"File mancante: {p}")

    print("Leggo PlayerElo…")
    elo_righe, elo_per_key = carica_elo()
    print(f"  {len(elo_righe)} giocatori italiani in PlayerElo")

    print("Aggrego statistiche partite (Serie A, dalla stagione %d)…" % STAGIONE_MIN)
    stats = carica_statistiche()
    print(f"  statistiche per {len(stats)} giocatori")

    print("Costruisco i record Transfermarkt (Serie A attiva)…")
    giocatori, usati_elo = costruisci(elo_per_key, stats)
    print(f"  {len(giocatori)} giocatori Serie A  (di cui {len(usati_elo)} arricchiti con Elo)")

    extra = aggiungi_solo_elo(elo_righe, usati_elo)
    giocatori += extra
    print(f"  + {len(extra)} giocatori solo-Elo (Serie B e Serie A senza match TM)")

    # ordina per campionato poi valore/elo desc
    giocatori.sort(key=lambda g: (
        g["campionato"],
        -(g["valore_eur"] or 0),
        -(g["elo"] or 0),
    ))

    out = {
        "generato": datetime.date.today().isoformat(),
        "totale": len(giocatori),
        "campionati": sorted({g["campionato"] for g in giocatori}),
        "giocatori": giocatori,
    }
    blob = json.dumps(out, ensure_ascii=False, indent=None)
    OUT_JSON.write_text(blob, encoding="utf-8")
    # versione .js: si apre con doppio click sull'HTML, senza server (no CORS)
    OUT_JS.write_text("window.DATI = " + blob + ";", encoding="utf-8")
    kb = OUT_JS.stat().st_size // 1024
    print(f"\n✅ Scritto {OUT_JS.name} e {OUT_JSON.name}  ({len(giocatori)} giocatori, {kb} KB)")
    # riepilogo per campionato
    from collections import Counter
    for lega, n in Counter(g["campionato"] for g in giocatori).most_common():
        print(f"   {lega}: {n}")


if __name__ == "__main__":
    main()
