import json
import urllib.request
import urllib.parse
import time
import os
import sys

def main():
    db_path = "src/data/free-exercise-db.json"
    cache_path = "scripts/translation_cache.json"
    output_path = "src/data/spanish-instructions.json"

    with open(db_path, "r", encoding="utf-8") as f:
        exercises = json.load(f)

    print(f"Total exercises loaded: {len(exercises)}")

    # Load cache if exists
    cache = {}
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                cache = json.load(f)
            print(f"Loaded {len(cache)} cached sentence translations.")
        except Exception as e:
            print(f"Warning reading cache: {e}")

    # Collect all unique sentences
    unique_sentences = []
    seen = set()
    for ex in exercises:
        for inst in ex.get("instructions", []):
            s = inst.strip()
            if s and s not in seen:
                seen.add(s)
                if s not in cache:
                    unique_sentences.append(s)

    print(f"Unique sentences needing translation: {len(unique_sentences)}")

    # Function to translate a single batch
    def translate_batch(batch):
        delim = " ||| "
        joined = delim.join(batch)
        url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=" + urllib.parse.quote(joined)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=12) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    translated_full = "".join([part[0] for part in data[0] if part[0]])
                    parts = translated_full.split(delim.strip())
                    if len(parts) == len(batch):
                        return [p.strip() for p in parts]
                    # If delimiters got slightly altered, try splitting by |||
                    parts2 = [p.strip() for p in translated_full.split("|||")]
                    if len(parts2) == len(batch):
                        return parts2
                    # Fallback: translate individually for this batch if split count mismatch
                    print(f"Delimiter mismatch ({len(parts)} vs {len(batch)}), translating individually...")
                    return [translate_single(item) for item in batch]
            except Exception as e:
                print(f"Attempt {attempt+1} failed: {e}")
                time.sleep(1.5)
        return [translate_single(item) for item in batch]

    def translate_single(text):
        url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=" + urllib.parse.quote(text)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return "".join([part[0] for part in data[0] if part[0]]).strip()
        except Exception:
            return text

    # Process in batches of 15
    batch_size = 15
    for i in range(0, len(unique_sentences), batch_size):
        batch = unique_sentences[i:i + batch_size]
        translated = translate_batch(batch)
        for orig, trans in zip(batch, translated):
            cache[orig] = trans
        
        # Save cache every 5 batches
        if (i // batch_size) % 5 == 0:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(cache, f, ensure_ascii=False, indent=2)
            pct = round((i + len(batch)) / len(unique_sentences) * 100, 1) if unique_sentences else 100
            print(f"Progress: {i + len(batch)} / {len(unique_sentences)} ({pct}%)")
        
        time.sleep(0.2)

    # Final save of cache
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)
    print("All sentences translated and cached.")

    # Now create exercise ID -> spanish instructions map
    spanish_by_id = {}
    for ex in exercises:
        ex_id = ex.get("id")
        orig_inst = ex.get("instructions", [])
        trans_inst = [cache.get(s.strip(), s) for s in orig_inst]
        spanish_by_id[ex_id] = trans_inst
        # Also update exercise object instructions
        ex["instructions_es"] = trans_inst
        ex["instructions"] = trans_inst

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(spanish_by_id, f, ensure_ascii=False, indent=2)
    print(f"Saved Spanish instructions dictionary to {output_path}")

    # Also rewrite free-exercise-db.json with Spanish instructions
    with open(db_path, "w", encoding="utf-8") as f:
        json.dump(exercises, f, ensure_ascii=False, indent=2)
    print(f"Updated {db_path} with Spanish instructions!")

if __name__ == "__main__":
    main()
