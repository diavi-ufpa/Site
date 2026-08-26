import difflib
import json
from pathlib import Path
from PySide6.QtWidgets import QMessageBox
from PySide6.QtCore import Qt

from cleanup_app.paths import APP_ROOT, ETL_ROOT

import sys
if str(APP_ROOT) not in sys.path:
    sys.path.insert(0, str(APP_ROOT))
if str(ETL_ROOT) not in sys.path:
    sys.path.insert(0, str(ETL_ROOT))

def get_occurrences_str(disc_df, doc_df, disc_label, doc_label, campus_norm, curso_norm) -> str:
    from src.utils.normalizer import normalize_text, normalize_course
    infos = []
    
    if disc_df is not None and "CAMPUS" in disc_df.columns and "CURSO" in disc_df.columns:
        disc_campus_norm = disc_df["CAMPUS"].map(normalize_text)
        disc_course_norm = disc_df["CURSO"].map(normalize_course)
        mask = (disc_campus_norm == campus_norm) & (disc_course_norm == curso_norm)
        matches = disc_df[mask]
        if not matches.empty:
            count = len(matches)
            originals = sorted(matches["CURSO"].unique())
            orig_str = ", ".join(f"'{o}'" for o in originals)
            infos.append(f"{count}x em {disc_label} (original: {orig_str})")
            
    if doc_df is not None and "CAMPUS" in doc_df.columns and "CURSO" in doc_df.columns:
        doc_campus_norm = doc_df["CAMPUS"].map(normalize_text)
        doc_course_norm = doc_df["CURSO"].map(normalize_course)
        mask = (doc_campus_norm == campus_norm) & (doc_course_norm == curso_norm)
        matches = doc_df[mask]
        if not matches.empty:
            count = len(matches)
            originals = sorted(matches["CURSO"].unique())
            orig_str = ", ".join(f"'{o}'" for o in originals)
            infos.append(f"{count}x em {doc_label} (original: {orig_str})")
            
    return "; ".join(infos)


def find_similar_courses(disc_df, doc_df, disc_label: str, doc_label: str) -> list[dict]:
    import re
    import difflib
    import pandas as pd
    from src.utils.normalizer import normalize_text, normalize_course
    
    combined = []
    if disc_df is not None and "CAMPUS" in disc_df.columns and "CURSO" in disc_df.columns:
        combined.append(disc_df[["CAMPUS", "CURSO"]])
    if doc_df is not None and "CAMPUS" in doc_df.columns and "CURSO" in doc_df.columns:
        combined.append(doc_df[["CAMPUS", "CURSO"]])
        
    if not combined:
        return []
        
    df = pd.concat(combined).drop_duplicates()
    
    def get_tokens(text: str) -> set[str]:
        return set(w for w in re.findall(r'\w+', str(text).lower()) if len(w) > 2)
        
    warnings = []
    
    df["CAMPUS_NORM"] = df["CAMPUS"].map(normalize_text)
    df["CURSO_NORM"] = df["CURSO"].map(normalize_course)
    
    for campus_norm, group in df.groupby("CAMPUS_NORM"):
        campus_name = group["CAMPUS"].iloc[0]
        courses = sorted(group["CURSO_NORM"].unique())
        
        for i in range(len(courses)):
            for j in range(i + 1, len(courses)):
                n1, n2 = courses[i], courses[j]
                
                t1, t2 = get_tokens(n1), get_tokens(n2)
                if not t1 or not t2:
                    continue
                
                matching_tokens = 0
                for w1 in t1:
                    for w2 in t2:
                        if w1 == w2 or difflib.SequenceMatcher(None, w1, w2).ratio() >= 0.88:
                            matching_tokens += 1
                            break
                
                union_size = len(t1) + len(t2) - matching_tokens
                jaccard = matching_tokens / union_size if union_size > 0 else 0
                
                if jaccard >= 0.8:
                    n1_info = get_occurrences_str(disc_df, doc_df, disc_label, doc_label, campus_norm, n1)
                    n2_info = get_occurrences_str(disc_df, doc_df, disc_label, doc_label, campus_norm, n2)
                    warnings.append({
                        "campus": campus_name,
                        "n1": n1,
                        "n1_info": n1_info,
                        "n2": n2,
                        "n2_info": n2_info
                    })
    return warnings


def check_and_resolve_entities(parent, disc_path: Path, doc_path: Path) -> bool:
    try:
        from src.graph_calculator import read_source
    except ImportError as e:
        print(f"Erro de importação no verificador de entidades: {e}")
        return True

    # Similarity Check for Courses in the same campus/period
    disc_df = None
    doc_df = None
    if disc_path and disc_path.is_file():
        try:
            disc_df = read_source(disc_path)
        except Exception:
            pass
    if doc_path and doc_path.is_file():
        try:
            doc_df = read_source(doc_path)
        except Exception:
            pass

    if disc_df is not None or doc_df is not None:
        disc_label = disc_path.name if disc_path else "DISC"
        doc_label = doc_path.name if doc_path else "DOC"
        similar_warnings = find_similar_courses(disc_df, doc_df, disc_label, doc_label)
        if similar_warnings:
            import html
            period_str = f" do período {parent.semester}" if hasattr(parent, "semester") else ""
            msg = (
                f"<b>Atenção:</b> Foram detectados nomes de cursos muito semelhantes no mesmo campus{period_str}. "
                "Isso pode indicar erros de digitação nas planilhas de origem.<br><br>"
                "<b>Detecções:</b><br>"
            )
            for warn in similar_warnings:
                msg += (
                    f"• Campus <b>{html.escape(warn['campus'])}</b>:<br>"
                    f"  - <code>'{html.escape(warn['n1'])}'</code>: {html.escape(warn['n1_info'])}<br>"
                    f"  - <code>'{html.escape(warn['n2'])}'</code>: {html.escape(warn['n2_info'])}<br><br>"
                )
                
            msg += (
                "Deseja prosseguir com a carga dos dados sob sua responsabilidade?<br>"
                "Se as informações estiverem incorretas, cancele a operação, corrija as planilhas e tente novamente."
            )
            
            reply = QMessageBox.warning(
                parent,
                "Possível Divergência de Cursos",
                msg,
                QMessageBox.Yes | QMessageBox.No,
                QMessageBox.No
            )
            if reply == QMessageBox.No:
                return False

    return True
