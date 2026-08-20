from __future__ import annotations

import re
from pathlib import Path

from PySide6.QtCore import Signal
from PySide6.QtWidgets import (
    QFileDialog,
    QFrame,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QVBoxLayout,
)


_SEMESTER_RE = re.compile(
    r"^(DISC|DOC)[_\-](\d{4})[_\-](\d{1,2})",
    re.IGNORECASE,
)


def extract_semester_from_filename(path: Path) -> tuple[int, int] | None:
    """Extrai (ano, período) do nome do arquivo, se seguir o padrão INSTR_AAAA_P.

    Retorna None quando o nome não permite dedução.
    """
    match = _SEMESTER_RE.match(path.stem)
    if not match:
        return None
    return int(match.group(2)), int(match.group(3))


def format_bytes(size: int) -> str:
    if size < 1024:
        return f"{size} B"
    if size < 1024**2:
        return f"{size / 1024:.1f} KB"
    return f"{size / 1024**2:.1f} MB"


class FilePicker(QFrame):
    path_changed = Signal(str)

    def __init__(self, instrument: str, description: str, parent=None) -> None:
        super().__init__(parent)
        self.instrument = instrument
        self.setObjectName("filePicker")
        self.setProperty("dragActive", False)
        self.setAcceptDrops(True)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(18, 16, 18, 16)
        layout.setSpacing(8)

        heading = QHBoxLayout()
        title = QLabel(f"Arquivo {instrument}")
        title.setObjectName("fieldLabel")
        heading.addWidget(title)
        heading.addStretch()

        self.status = QLabel("Não selecionado")
        self.status.setObjectName("statusNeutral")
        heading.addWidget(self.status)
        layout.addLayout(heading)

        helper = QLabel(description)
        helper.setObjectName("fieldHelp")
        helper.setWordWrap(True)
        layout.addWidget(helper)

        input_row = QHBoxLayout()
        input_row.setSpacing(8)
        self.path_input = QLineEdit()
        self.path_input.setReadOnly(True)
        self.path_input.setPlaceholderText("Selecione ou arraste um arquivo CSV/XLSX")
        self.path_input.setAccessibleName(f"Caminho do arquivo {instrument}")
        input_row.addWidget(self.path_input, 1)

        browse_button = QPushButton("Selecionar arquivo")
        browse_button.setObjectName("quietButton")
        browse_button.clicked.connect(self._browse)
        input_row.addWidget(browse_button)
        layout.addLayout(input_row)

        self.meta = QLabel("Formatos aceitos: CSV e XLSX")
        self.meta.setObjectName("fileMeta")
        layout.addWidget(self.meta)

    @property
    def path(self) -> Path | None:
        value = self.path_input.text().strip()
        return Path(value) if value else None

    def set_path(self, path: str | Path) -> None:
        file_path = Path(path).resolve()
        self.path_input.setText(str(file_path))
        if file_path.is_file():
            self.meta.setText(f"{file_path.name} · {format_bytes(file_path.stat().st_size)}")
            self.status.setText("Selecionado")
            self.status.setObjectName("statusSuccess")
        else:
            self.meta.setText("Arquivo não encontrado")
            self.status.setText("Inválido")
            self.status.setObjectName("statusError")
        self.status.style().unpolish(self.status)
        self.status.style().polish(self.status)
        self.path_changed.emit(str(file_path))

    def set_controls_enabled(self, enabled: bool) -> None:
        self.setEnabled(enabled)

    def _browse(self) -> None:
        path, _ = QFileDialog.getOpenFileName(
            self,
            f"Selecionar arquivo {self.instrument}",
            str(Path.home()),
            "Planilhas (*.csv *.xlsx);;CSV (*.csv);;Excel (*.xlsx)",
        )
        if path:
            self.set_path(path)

    def dragEnterEvent(self, event) -> None:
        urls = event.mimeData().urls()
        if len(urls) == 1 and urls[0].isLocalFile():
            suffix = Path(urls[0].toLocalFile()).suffix.lower()
            if suffix in {".csv", ".xlsx"}:
                event.acceptProposedAction()
                self._set_drag_active(True)

    def dragLeaveEvent(self, event) -> None:
        self._set_drag_active(False)
        super().dragLeaveEvent(event)

    def dropEvent(self, event) -> None:
        self._set_drag_active(False)
        urls = event.mimeData().urls()
        if len(urls) == 1 and urls[0].isLocalFile():
            self.set_path(urls[0].toLocalFile())
            event.acceptProposedAction()

    def _set_drag_active(self, active: bool) -> None:
        self.setProperty("dragActive", active)
        self.style().unpolish(self)
        self.style().polish(self)

