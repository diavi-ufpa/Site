import difflib
import json
from pathlib import Path
from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QComboBox, QPushButton,
    QScrollArea, QWidget, QMessageBox
)
from PySide6.QtCore import Qt

from cleanup_app.paths import APP_ROOT

import sys
if str(APP_ROOT) not in sys.path:
    sys.path.insert(0, str(APP_ROOT))

def get_entities_path() -> Path:
    return APP_ROOT / "avalia_etl" / "config" / "entidades.json"

def check_and_resolve_entities(parent, disc_path: Path, doc_path: Path) -> bool:
    try:
        from avalia_etl.src.catalog import EntityCatalog
        from avalia_etl.src.graph_calculator import read_source
        from avalia_etl.src.utils.normalizer import normalize_text
    except ImportError:
        # Se falhar o import, ignora e deixa o script de ETL lidar com isso.
        return True

    entities_path = get_entities_path()
    try:
        catalog = EntityCatalog(entities_path)
    except Exception:
        return True

    unknown_campuses = set()
    unknown_courses = set()

    for path in [disc_path, doc_path]:
        if not path or not path.is_file():
            continue
        try:
            df = read_source(path)
        except Exception:
            continue
            
        if "CAMPUS" in df.columns:
            for raw in df["CAMPUS"].unique():
                try:
                    catalog.campus(raw)
                except ValueError:
                    normalized = normalize_text(raw)
                    if normalized:
                        unknown_campuses.add(raw)
                        
        if "CURSO" in df.columns:
            for raw in df["CURSO"].unique():
                try:
                    catalog.course(raw)
                except ValueError:
                    normalized = normalize_text(raw)
                    if normalized:
                        unknown_courses.add(raw)

    if not unknown_campuses and not unknown_courses:
        return True

    return _show_resolution_dialog(parent, catalog, entities_path, unknown_campuses, unknown_courses)

def _show_resolution_dialog(parent, catalog, entities_path, unknown_campuses, unknown_courses) -> bool:
    from avalia_etl.src.utils.normalizer import normalize_text
    
    dialog = QDialog(parent)
    dialog.setWindowTitle("Resolver Nomes Desconhecidos")
    dialog.resize(700, 500)
    
    layout = QVBoxLayout(dialog)
    layout.addWidget(QLabel("Foram encontrados nomes de Campus ou Cursos na planilha que não constam na base oficial."))
    layout.addWidget(QLabel("Por favor, selecione qual é o nome correto para cada um deles (mapeamento de sinônimos)."))
    
    scroll = QScrollArea()
    scroll.setWidgetResizable(True)
    viewport = QWidget()
    form_layout = QVBoxLayout(viewport)
    
    results = {}
    
    def add_section(title, unknowns, known_canonical):
        if not unknowns: return
        
        lbl = QLabel(title)
        lbl.setStyleSheet("font-weight: bold; margin-top: 10px; font-size: 16px; color: #101828;")
        form_layout.addWidget(lbl)
        
        for raw in sorted(unknowns):
            row = QHBoxLayout()
            row_label = QLabel(f"'{raw}' equivale a:")
            row_label.setWordWrap(True)
            row.addWidget(row_label)
            
            combo = QComboBox()
            combo.addItem("-- Selecione o nome correto --", None)
            
            normalized_raw = normalize_text(raw)
            known_normalized = {normalize_text(k): k for k in known_canonical}
            matches = difflib.get_close_matches(normalized_raw, known_normalized.keys(), n=1, cutoff=0.5)
            
            for k in sorted(known_canonical):
                combo.addItem(k, k)
                
            if matches:
                best_match = known_normalized[matches[0]]
                idx = combo.findText(best_match)
                if idx >= 0:
                    combo.setCurrentIndex(idx)
                    
            row.addWidget(combo, 1)
            form_layout.addLayout(row)
            
            results[raw] = combo

    add_section("Campuses Desconhecidos", unknown_campuses, catalog.campuses)
    add_section("Cursos Desconhecidos", unknown_courses, catalog.courses)
    
    form_layout.addStretch()
    scroll.setWidget(viewport)
    layout.addWidget(scroll)
    
    btn_layout = QHBoxLayout()
    btn_cancel = QPushButton("Cancelar Validação")
    btn_cancel.clicked.connect(dialog.reject)
    btn_save = QPushButton("Salvar Mapeamentos")
    btn_save.setObjectName("primaryButton")
    
    def on_save():
        for combo in results.values():
            if combo.currentData() is None:
                QMessageBox.warning(dialog, "Atenção", "Por favor, mapeie todos os nomes desconhecidos antes de continuar.")
                return
        dialog.accept()
        
    btn_save.clicked.connect(on_save)
    
    btn_layout.addStretch()
    btn_layout.addWidget(btn_cancel)
    btn_layout.addWidget(btn_save)
    layout.addLayout(btn_layout)
    
    if dialog.exec() == QDialog.Accepted:
        with open(entities_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        aliases = data.setdefault("aliases", {})
        campi_aliases = aliases.setdefault("campi", {})
        cursos_aliases = aliases.setdefault("cursos", {})
        
        for raw in unknown_campuses:
            campi_aliases[raw] = results[raw].currentData()
        for raw in unknown_courses:
            cursos_aliases[raw] = results[raw].currentData()
            
        with open(entities_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        return True
    return False
