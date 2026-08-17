from __future__ import annotations

import os
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from PySide6.QtCore import QProcess, QProcessEnvironment, Qt
from PySide6.QtGui import QCloseEvent, QTextCursor
from PySide6.QtWidgets import (
    QCheckBox,
    QComboBox,
    QFrame,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMainWindow,
    QMessageBox,
    QPlainTextEdit,
    QProgressBar,
    QPushButton,
    QScrollArea,
    QSizePolicy,
    QSpinBox,
    QVBoxLayout,
    QWidget,
    QStackedWidget,
    QGridLayout,
    QButtonGroup,
    QDialog,
)

from cleanup_app.database import DatabaseWorker
from cleanup_app.file_picker import FilePicker
from cleanup_app.paths import APP_ROOT, ETL_SCRIPT, SCHEMA_FILE, SITE_ROOT


DATABASE_ENV = "AVALIA_PRESENCIAL_GRAPH_DATABASE_URL"


def _label(text: str, object_name: str, *, word_wrap: bool = False) -> QLabel:
    widget = QLabel(text)
    widget.setObjectName(object_name)
    widget.setWordWrap(word_wrap)
    return widget


def _panel() -> tuple[QFrame, QVBoxLayout]:
    frame = QFrame()
    frame.setObjectName("panel")
    layout = QVBoxLayout(frame)
    layout.setContentsMargins(22, 20, 22, 20)
    layout.setSpacing(14)
    return frame, layout

def _card() -> tuple[QFrame, QVBoxLayout]:
    frame = QFrame()
    frame.setProperty("class", "card")
    layout = QVBoxLayout(frame)
    layout.setContentsMargins(22, 20, 22, 20)
    layout.setSpacing(14)
    return frame, layout


class MainWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("DIAVI — Administração de dados")
        self.resize(1220, 820)
        self.setMinimumSize(980, 680)

        self.database_worker: DatabaseWorker | None = None
        self.database_ready = False
        self.imported_periods: set[str] = set()
        self.validated_signature: tuple | None = None
        self.process_mode: str | None = None
        self.process_was_cancelled = False

        load_dotenv(APP_ROOT / ".env", override=False)
        load_dotenv(SITE_ROOT / ".env.local", override=False)

        self.process = QProcess(self)
        self.process.setProcessChannelMode(QProcess.MergedChannels)
        self.process.readyReadStandardOutput.connect(self._read_process_output)
        self.process.finished.connect(self._process_finished)
        self.process.errorOccurred.connect(self._process_error)

        self._build_ui()
        self._refresh_controls()

    def _build_ui(self) -> None:
        root = QWidget()
        root.setObjectName("appRoot")
        root_layout = QHBoxLayout(root)
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.setSpacing(0)
        self.setCentralWidget(root)

        self.stack = QStackedWidget()
        self.stack.addWidget(self._build_page_home())      # 0
        self.stack.addWidget(self._build_page_config())    # 1
        self.stack.addWidget(self._build_page_avalia())    # 2
        self.stack.addWidget(self._build_page_avalia_etl())# 3

        root_layout.addWidget(self._build_sidebar())
        root_layout.addWidget(self.stack, 1)

    def _build_sidebar(self) -> QWidget:
        sidebar = QWidget()
        sidebar.setObjectName("sidebar")
        sidebar.setFixedWidth(238)
        layout = QVBoxLayout(sidebar)
        layout.setContentsMargins(22, 28, 22, 24)
        layout.setSpacing(12)

        layout.addWidget(_label("DIAVI", "brandMark"))
        subtitle = _label("Administração de dados", "brandSubtitle", word_wrap=True)
        layout.addWidget(subtitle)
        layout.addSpacing(20)
        layout.addWidget(_label("MENU", "sidebarCaption"))
        
        self.nav_group = QButtonGroup(self)
        
        self.btn_home = QPushButton("Início")
        self.btn_home.setProperty("class", "navButton")
        self.btn_home.setCheckable(True)
        self.btn_home.setChecked(True)
        self.btn_home.clicked.connect(lambda: self.stack.setCurrentIndex(0))
        self.nav_group.addButton(self.btn_home)
        layout.addWidget(self.btn_home)
        
        self.btn_config = QPushButton("Configurações")
        self.btn_config.setProperty("class", "navButton")
        self.btn_config.setCheckable(True)
        self.btn_config.clicked.connect(lambda: self.stack.setCurrentIndex(1))
        self.nav_group.addButton(self.btn_config)
        layout.addWidget(self.btn_config)
        
        layout.addSpacing(10)
        layout.addWidget(_label("CARGAS", "sidebarCaption"))

        self.btn_avalia = QPushButton("Avalia Presencial\nDISC + DOC")
        self.btn_avalia.setProperty("class", "navButton")
        self.btn_avalia.setCheckable(True)
        self.btn_avalia.clicked.connect(lambda: self.stack.setCurrentIndex(2))
        self.nav_group.addButton(self.btn_avalia)
        layout.addWidget(self.btn_avalia)

        layout.addStretch()
        privacy = _label(
            "Os arquivos são processados localmente. Apenas resultados agregados são publicados.",
            "mutedText",
            word_wrap=True,
        )
        privacy.setAccessibleName("Informação de privacidade")
        layout.addWidget(privacy)
        return sidebar

    def _create_scroll_page(self) -> tuple[QScrollArea, QVBoxLayout]:
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)

        viewport = QWidget()
        outer = QHBoxLayout(viewport)
        outer.setContentsMargins(34, 28, 34, 34)
        outer.addStretch()

        content = QWidget()
        content.setMaximumWidth(980)
        content.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Preferred)
        content_layout = QVBoxLayout(content)
        content_layout.setContentsMargins(0, 0, 0, 0)
        content_layout.setSpacing(18)

        outer.addWidget(content, 1)
        outer.addStretch()
        scroll.setWidget(viewport)
        return scroll, content_layout

    def _build_page_home(self) -> QWidget:
        scroll, layout = self._create_scroll_page()
        
        layout.addWidget(_label("Modalidades de Carga", "pageTitle"))
        layout.addWidget(_label("Selecione a modalidade que deseja gerenciar.", "mutedText", word_wrap=True))
        
        grid = QGridLayout()
        grid.setSpacing(16)
        
        def make_modality_card(title, subtitle, callback=None):
            card, l = _card()
            l.addWidget(_label(title, "sectionTitle"))
            l.addWidget(_label(subtitle, "mutedText", word_wrap=True))
            btn = QPushButton("Acessar")
            btn.setObjectName("secondaryButton")
            if callback:
                btn.clicked.connect(callback)
            else:
                btn.setEnabled(False)
            l.addWidget(btn, 0, Qt.AlignLeft)
            return card
            
        grid.addWidget(make_modality_card("Avalia Presencial", "Submodalidades: DISC, DOC", lambda: (self.btn_avalia.setChecked(True), self.stack.setCurrentIndex(2))), 0, 0)
        grid.addWidget(make_modality_card("In loco", "Dados de visitas e avaliações in loco"), 0, 1)
        grid.addWidget(make_modality_card("Microdados", "Microdados consolidados e abertos"), 1, 0)
        grid.addWidget(make_modality_card("Minha Opinião", "Formulários e opiniões gerais"), 1, 1)
        
        layout.addLayout(grid)
        layout.addSpacing(20)
        
        layout.addWidget(_label("Perguntas Frequentes (FAQ)", "sectionTitle"))
        
        faq1, l1 = _panel()
        l1.addWidget(_label("Como faço para adicionar uma nova carga?", "fieldLabel"))
        l1.addWidget(_label("Texto temporário. Selecione a modalidade na tela inicial ou no menu lateral e clique em 'Adicionar nova carga'. Siga as instruções descritas na tela de upload.", "mutedText", word_wrap=True))
        layout.addWidget(faq1)
        
        faq2, l2 = _panel()
        l2.addWidget(_label("Qual formato de arquivo é aceito?", "fieldLabel"))
        l2.addWidget(_label("Texto temporário. Geralmente aceitamos CSV e XLSX, mas cada carga tem suas regras específicas detalhadas na respectiva página.", "mutedText", word_wrap=True))
        layout.addWidget(faq2)
        
        layout.addStretch()
        return scroll

    def _build_page_config(self) -> QWidget:
        scroll, layout = self._create_scroll_page()
        layout.addWidget(_label("Configurações", "pageTitle"))
        layout.addWidget(_label("Gerencie as conexões de banco de dados de todas as modalidades.", "mutedText", word_wrap=True))
        
        layout.addWidget(self._build_database_panel())
        
        layout.addStretch()
        return scroll
        
    def _build_page_avalia(self) -> QWidget:
        scroll, layout = self._create_scroll_page()
        
        layout.addWidget(_label("Avalia Presencial", "pageTitle"))
        layout.addWidget(_label("O Avalia Presencial processa respostas de questionários discentes (DISC) e docentes (DOC), validando o cruzamento de turmas, disciplinas e médias.", "mutedText", word_wrap=True))
        
        panel, l = _panel()
        l.addWidget(_label("Situação do Banco de Dados", "sectionTitle"))
        
        self.status_db_label = _label("Verifique a conexão em Configurações para ver os semestres publicados.", "mutedText", word_wrap=True)
        l.addWidget(self.status_db_label)
        
        self.status_db_size = _label("Espaço consumido: (Disponível após verificação)", "mutedText")
        l.addWidget(self.status_db_size)
        
        btn_add = QPushButton("Adicionar nova carga")
        btn_add.setObjectName("primaryButton")
        btn_add.clicked.connect(lambda: self.stack.setCurrentIndex(3))
        
        l.addWidget(btn_add, 0, Qt.AlignLeft)
        
        layout.addWidget(panel)
        layout.addStretch()
        return scroll

    def _build_page_avalia_etl(self) -> QWidget:
        scroll, layout = self._create_scroll_page()
        
        row = QHBoxLayout()
        copy = QVBoxLayout()
        copy.setSpacing(5)
        
        btn_back = QPushButton("← Voltar")
        btn_back.setProperty("class", "navButton")
        btn_back.clicked.connect(lambda: self.stack.setCurrentIndex(2))
        layout.addWidget(btn_back, 0, Qt.AlignLeft)
        
        copy.addWidget(_label("Nova carga do Avalia Presencial", "pageTitle"))
        copy.addWidget(
            _label(
                "Valide o par de planilhas localmente e publique um novo semestre no banco do site.",
                "mutedText",
                word_wrap=True,
            )
        )
        row.addLayout(copy, 1)
        self.overall_status = _label("Aguardando arquivos", "statusNeutral")
        self.overall_status.setAlignment(Qt.AlignCenter)
        row.addWidget(self.overall_status, 0, Qt.AlignTop)
        
        layout.addLayout(row)
        
        inst_panel, il = _panel()
        il.addWidget(_label("Instruções para nova carga", "sectionTitle"))
        inst_text = (
            "1. Selecione o ano e o período (1 a 6) da carga.\n"
            "2. Selecione o arquivo DISC (respostas discentes) em formato CSV ou XLSX.\n"
            "3. Selecione o arquivo DOC (respostas docentes) em formato CSV ou XLSX.\n"
            "4. Verifique se os arquivos são brutos (sem sufixo _SNTZD).\n"
            "5. Clique em 'Validar arquivos' para realizar cálculos locais sem afetar o banco.\n"
            "6. Após validação bem sucedida, marque a caixa de confirmação e publique."
        )
        il.addWidget(_label(inst_text, "mutedText", word_wrap=True))
        layout.addWidget(inst_panel)

        layout.addWidget(self._build_sources_panel())
        layout.addWidget(self._build_execution_panel())
        layout.addStretch()
        return scroll

    def _build_database_panel(self) -> QFrame:
        frame, layout = _panel()
        heading = QHBoxLayout()
        title_copy = QVBoxLayout()
        title_copy.setSpacing(3)
        title_copy.addWidget(_label("Conexão com o banco - Avalia Presencial", "sectionTitle"))
        title_copy.addWidget(
            _label(
                "A credencial fica somente nesta sessão e nunca aparece no registro.",
                "mutedText",
                word_wrap=True,
            )
        )
        heading.addLayout(title_copy, 1)
        self.database_status = _label("Não verificado", "statusNeutral")
        heading.addWidget(self.database_status, 0, Qt.AlignTop)
        layout.addLayout(heading)

        connection_row = QHBoxLayout()
        connection_row.setSpacing(8)
        self.database_url = QLineEdit(os.getenv(DATABASE_ENV, ""))
        self.database_url.setEchoMode(QLineEdit.Password)
        self.database_url.setPlaceholderText("postgresql://usuario:senha@host/banco")
        self.database_url.setAccessibleName("URL do banco de resultados")
        self.database_url.textChanged.connect(self._database_value_changed)
        connection_row.addWidget(self.database_url, 1)

        self.reveal_url = QPushButton("Exibir")
        self.reveal_url.setObjectName("quietButton")
        self.reveal_url.setCheckable(True)
        self.reveal_url.setAccessibleName("Exibir ou ocultar URL do banco")
        self.reveal_url.toggled.connect(self._toggle_database_visibility)
        connection_row.addWidget(self.reveal_url)

        self.test_database_button = QPushButton("Verificar conexão")
        self.test_database_button.setObjectName("secondaryButton")
        self.test_database_button.clicked.connect(self._check_database)
        connection_row.addWidget(self.test_database_button)
        layout.addLayout(connection_row)

        database_actions = QHBoxLayout()
        self.database_detail = _label(
            "Informe a URL ou defina a variável no arquivo cleanup/.env.\n"
            "O arquivo de modelagem de banco de dados é lido para compreender a situação do banco, "
            "mas indicamos que sua execução seja feita diretamente no seu editor SQL (ex: DBeaver, pgAdmin).",
            "mutedText",
            word_wrap=True,
        )
        database_actions.addWidget(self.database_detail, 1)
        self.view_schema_button = QPushButton("Visualizar modelagem do banco")
        self.view_schema_button.setObjectName("quietButton")
        self.view_schema_button.clicked.connect(self._view_database_schema)
        database_actions.addWidget(self.view_schema_button)
        layout.addLayout(database_actions)

        return frame

    def _build_sources_panel(self) -> QFrame:
        frame, layout = _panel()
        heading = QHBoxLayout()
        title_copy = QVBoxLayout()
        title_copy.setSpacing(3)
        title_copy.addWidget(_label("Arquivos da carga", "sectionTitle"))
        title_copy.addWidget(
            _label(
                "Use as planilhas brutas oficiais. Arquivos *_SNTZD são derivados e serão recusados.",
                "mutedText",
                word_wrap=True,
            )
        )
        heading.addLayout(title_copy, 1)

        semester_box = QHBoxLayout()
        semester_box.setSpacing(8)
        semester_box.addWidget(_label("Semestre", "fieldLabel"))
        self.year_input = QSpinBox()
        self.year_input.setRange(2000, 2100)
        self.year_input.setValue(datetime.now().year)
        self.year_input.setAccessibleName("Ano do semestre")
        self.year_input.valueChanged.connect(self._inputs_changed)
        semester_box.addWidget(self.year_input)
        self.period_input = QComboBox()
        self.period_input.addItems([str(value) for value in range(1, 7)])
        self.period_input.setCurrentText("2")
        self.period_input.setAccessibleName("Período do semestre")
        self.period_input.currentTextChanged.connect(self._inputs_changed)
        semester_box.addWidget(self.period_input)
        heading.addLayout(semester_box)
        layout.addLayout(heading)

        self.disc_picker = FilePicker(
            "DISC",
            "Respostas discentes. O nome deve começar com DISC_AAAA_P.",
        )
        self.doc_picker = FilePicker(
            "DOC",
            "Respostas docentes. O nome deve começar com DOC_AAAA_P.",
        )
        self.disc_picker.path_changed.connect(self._inputs_changed)
        self.doc_picker.path_changed.connect(self._inputs_changed)
        layout.addWidget(self.disc_picker)
        layout.addWidget(self.doc_picker)

        self.input_message = _label("Selecione os dois arquivos para continuar.", "mutedText")
        self.input_message.setWordWrap(True)
        layout.addWidget(self.input_message)
        return frame

    def _build_execution_panel(self) -> QFrame:
        frame = QFrame()
        frame.setObjectName("logPanel")
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(22, 20, 22, 20)
        layout.setSpacing(14)

        title_row = QHBoxLayout()
        title_copy = QVBoxLayout()
        title_copy.setSpacing(3)
        title_copy.addWidget(_label("Validar e publicar", "sectionTitle"))
        title_copy.addWidget(
            _label(
                "A validação executa todos os cálculos sem conectar ao banco.",
                "mutedText",
                word_wrap=True,
            )
        )
        title_row.addLayout(title_copy, 1)
        self.execution_status = _label("Pendente", "statusNeutral")
        title_row.addWidget(self.execution_status, 0, Qt.AlignTop)
        layout.addLayout(title_row)

        self.confirmation = QCheckBox(
            "Confirmo que o semestre e os arquivos estão corretos e que a publicação é imutável."
        )
        self.confirmation.setEnabled(False)
        self.confirmation.toggled.connect(self._refresh_controls)
        layout.addWidget(self.confirmation)

        actions = QHBoxLayout()
        self.validate_button = QPushButton("Validar arquivos")
        self.validate_button.setObjectName("secondaryButton")
        self.validate_button.clicked.connect(self._start_validation)
        actions.addWidget(self.validate_button)

        self.publish_button = QPushButton("Publicar no site")
        self.publish_button.setObjectName("primaryButton")
        self.publish_button.clicked.connect(self._start_publication)
        actions.addWidget(self.publish_button)

        self.cancel_button = QPushButton("Cancelar validação")
        self.cancel_button.setObjectName("quietButton")
        self.cancel_button.clicked.connect(self._cancel_validation)
        actions.addWidget(self.cancel_button)
        actions.addStretch()
        layout.addLayout(actions)

        self.progress = QProgressBar()
        self.progress.setRange(0, 0)
        self.progress.setTextVisible(False)
        self.progress.hide()
        layout.addWidget(self.progress)

        log_heading = QHBoxLayout()
        log_heading.addWidget(_label("Registro da execução", "fieldLabel"))
        log_heading.addStretch()
        clear_log = QPushButton("Limpar")
        clear_log.setObjectName("quietButton")
        clear_log.clicked.connect(self._clear_log)
        log_heading.addWidget(clear_log)
        layout.addLayout(log_heading)

        self.log = QPlainTextEdit()
        self.log.setReadOnly(True)
        self.log.setMinimumHeight(180)
        self.log.setAccessibleName("Registro da execução do ETL")
        self.log.setPlaceholderText("As mensagens de validação e publicação aparecerão aqui.")
        layout.addWidget(self.log)
        return frame

    @property
    def semester(self) -> str:
        return f"{self.year_input.value()}-{self.period_input.currentText()}"

    def _toggle_database_visibility(self, visible: bool) -> None:
        self.database_url.setEchoMode(QLineEdit.Normal if visible else QLineEdit.Password)
        self.reveal_url.setText("Ocultar" if visible else "Exibir")

    def _database_value_changed(self) -> None:
        self.database_ready = False
        self.imported_periods.clear()
        self._set_status(self.database_status, "Não verificado", "neutral")
        self.database_detail.setText("Verifique a conexão antes de publicar.")
        self.status_db_label.setText("Semestres publicados: conexão ainda não verificada.")
        self._refresh_controls()

    def _inputs_changed(self, *_args) -> None:
        self.validated_signature = None
        self.confirmation.setChecked(False)
        self.confirmation.setEnabled(False)
        self._set_status(self.execution_status, "Pendente", "neutral")
        self._validate_input_contract(show_dialog=False)
        self._refresh_controls()

    def _current_signature(self) -> tuple | None:
        paths = (self.disc_picker.path, self.doc_picker.path)
        if any(path is None or not path.is_file() for path in paths):
            return None
        return (
            self.semester,
            *(
                (str(path.resolve()), path.stat().st_size, path.stat().st_mtime_ns)
                for path in paths
            ),
        )

    def _validate_input_contract(self, *, show_dialog: bool) -> bool:
        errors: list[str] = []
        year = self.year_input.value()
        period = self.period_input.currentText()
        for instrument, picker in (("DISC", self.disc_picker), ("DOC", self.doc_picker)):
            path = picker.path
            if path is None:
                errors.append(f"Selecione o arquivo {instrument}.")
                continue
            if not path.is_file():
                errors.append(f"O arquivo {instrument} não foi encontrado.")
                continue
            if path.suffix.lower() not in {".csv", ".xlsx"}:
                errors.append(f"O arquivo {instrument} deve ser CSV ou XLSX.")
            expected = f"{instrument}_{year}_{period}"
            if not path.stem.upper().startswith(expected):
                errors.append(f"O nome de {instrument} deve começar com {expected}.")
            if path.stem.upper().endswith("_SNTZD"):
                errors.append(f"O arquivo {instrument} é derivado (_SNTZD); use a fonte bruta.")

        if errors:
            self.input_message.setText(errors[0])
            self.input_message.setStyleSheet("color: #b42318;")
            if show_dialog:
                QMessageBox.warning(self, "Revise os arquivos", "\n".join(errors))
            return False

        if self.semester in self.imported_periods:
            message = f"O semestre {self.semester} já foi publicado e não pode ser substituído."
            self.input_message.setText(message)
            self.input_message.setStyleSheet("color: #b42318;")
            if show_dialog:
                QMessageBox.warning(self, "Semestre já publicado", message)
            return False

        self.input_message.setText("Arquivos compatíveis com o semestre selecionado.")
        self.input_message.setStyleSheet("color: #027a48;")
        return True

    def _check_database(self) -> None:
        self._start_database_worker(initialize=False)

    def _view_database_schema(self) -> None:
        try:
            with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
                schema_content = f.read()
        except Exception as e:
            QMessageBox.warning(self, "Erro", f"Não foi possível ler o arquivo de modelagem: {e}")
            return
            
        dialog = QDialog(self)
        dialog.setWindowTitle("Visualizar Modelagem (schema.sql)")
        dialog.resize(600, 500)
        layout = QVBoxLayout(dialog)
        layout.addWidget(_label("Conteúdo do arquivo schema.sql:", "fieldLabel"))
        text_edit = QPlainTextEdit()
        text_edit.setReadOnly(True)
        text_edit.setPlainText(schema_content)
        layout.addWidget(text_edit)
        btn_close = QPushButton("Fechar")
        btn_close.clicked.connect(dialog.accept)
        layout.addWidget(btn_close, 0, Qt.AlignRight)
        dialog.exec()

    def _start_database_worker(self, *, initialize: bool) -> None:
        database_url = self.database_url.text().strip()
        if not database_url:
            QMessageBox.warning(self, "Conexão ausente", "Informe a URL do banco primeiro.")
            return
        if self.database_worker and self.database_worker.isRunning():
            return

        self.database_ready = False
        self._set_status(self.database_status, "Verificando…", "warning")
        self.database_detail.setText(
            "Criando a estrutura e verificando o banco…"
            if initialize
            else "Verificando acesso e estrutura…"
        )
        self.database_worker = DatabaseWorker(
            database_url,
            schema_file=SCHEMA_FILE,
            initialize_schema=initialize,
            parent=self,
        )
        self.database_worker.completed.connect(self._database_completed)
        self.database_worker.failed.connect(self._database_failed)
        self.database_worker.finished.connect(self._database_worker_finished)
        self.database_worker.start()
        self._refresh_controls()

    def _database_completed(self, result: dict) -> None:
        self.database_ready = bool(result["schema_ready"])
        self.imported_periods = set(result["periods"])
        if self.database_ready:
            self._set_status(self.database_status, "Pronto", "success")
            action = "Estrutura criada. " if result["initialized"] else ""
            self.database_detail.setText(
                f"{action}Conectado ao banco {result['database_name']}."
            )
            if self.imported_periods:
                periods = ", ".join(sorted(self.imported_periods, reverse=True))
                self.status_db_label.setText(f"Semestres publicados: {periods}")
            else:
                self.status_db_label.setText("Nenhum semestre foi publicado neste banco.")
        else:
            self._set_status(self.database_status, "Estrutura ausente", "warning")
            self.database_detail.setText(
                "A conexão funciona, mas a estrutura de resultados ainda não existe."
            )
            self.status_db_label.setText(
                "Execute o arquivo de modelagem no banco de dados antes da primeira publicação."
            )
        self._validate_input_contract(show_dialog=False)

    def _database_failed(self, message: str) -> None:
        self.database_ready = False
        self.imported_periods.clear()
        self._set_status(self.database_status, "Falha", "error")
        self.database_detail.setText(f"Não foi possível verificar a conexão: {message}")
        self.status_db_label.setText("Semestres publicados: conexão com banco indisponível.")

    def _database_worker_finished(self) -> None:
        if self.database_worker:
            self.database_worker.deleteLater()
            self.database_worker = None
        self._refresh_controls()

    def _start_validation(self) -> None:
        if not self._validate_input_contract(show_dialog=True):
            return
            
        from cleanup_app.entity_resolver import check_and_resolve_entities
        resolved = check_and_resolve_entities(
            self,
            self.disc_picker.path,
            self.doc_picker.path
        )
        if not resolved:
            return
            
        self._start_etl("validate")

    def _start_publication(self) -> None:
        if not self._validate_input_contract(show_dialog=True):
            return
        signature = self._current_signature()
        if signature is None or signature != self.validated_signature:
            QMessageBox.warning(
                self,
                "Validação necessária",
                "Os arquivos mudaram desde a última validação. Valide novamente antes de publicar.",
            )
            return
        if not self.database_ready:
            QMessageBox.warning(
                self,
                "Banco não verificado",
                "Verifique a conexão e a estrutura do banco antes de publicar.",
            )
            return
        if not self.confirmation.isChecked():
            return

        answer = QMessageBox.question(
            self,
            f"Publicar {self.semester}",
            f"O semestre {self.semester} será gravado de forma imutável.\n\n"
            f"DISC: {self.disc_picker.path.name}\n"
            f"DOC: {self.doc_picker.path.name}\n\n"
            "Confirma a publicação?",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No,
        )
        if answer == QMessageBox.Yes:
            self._start_etl("publish")

    def _start_etl(self, mode: str) -> None:
        if self.process.state() != QProcess.ProcessState.NotRunning:
            return

        self.process_mode = mode
        self.process_was_cancelled = False
        self._append_log(
            f"\n[{datetime.now():%H:%M:%S}] "
            + ("Iniciando validação local." if mode == "validate" else "Iniciando publicação.")
        )

        arguments = [
            str(ETL_SCRIPT),
            "--semester",
            self.semester,
            "--disc",
            str(self.disc_picker.path),
            "--doc",
            str(self.doc_picker.path),
        ]
        if mode == "validate":
            arguments.append("--dry-run")

        environment = QProcessEnvironment.systemEnvironment()
        environment.insert("PYTHONUNBUFFERED", "1")
        environment.insert("PYTHONIOENCODING", "utf-8")
        if mode == "publish":
            environment.insert(DATABASE_ENV, self.database_url.text().strip())

        self.process.setProcessEnvironment(environment)
        self.process.setWorkingDirectory(str(ETL_SCRIPT.parent.parent))
        self.process.setProgram(sys.executable)
        self.process.setArguments(arguments)
        self.process.start()

        self.progress.show()
        if mode == "validate":
            self._set_status(self.execution_status, "Validando…", "warning")
            self._set_status(self.overall_status, "Validando arquivos", "warning")
        else:
            self._set_status(self.execution_status, "Publicando…", "warning")
            self._set_status(self.overall_status, "Publicando semestre", "warning")
        self._refresh_controls()

    def _read_process_output(self) -> None:
        raw = bytes(self.process.readAllStandardOutput())
        if not raw:
            return
        text = raw.decode("utf-8", errors="replace")
        self.log.moveCursor(QTextCursor.MoveOperation.End)
        self.log.insertPlainText(text)
        self.log.moveCursor(QTextCursor.MoveOperation.End)

    def _process_finished(self, exit_code: int, _exit_status) -> None:
        mode = self.process_mode
        self.progress.hide()
        if self.process_was_cancelled:
            self._append_log(f"\n[{datetime.now():%H:%M:%S}] Validação cancelada pelo usuário.\n")
            self._set_status(self.execution_status, "Cancelada", "neutral")
            self._set_status(self.overall_status, "Aguardando validação", "neutral")
        elif exit_code == 0 and mode == "validate":
            self.validated_signature = self._current_signature()
            self.confirmation.setEnabled(True)
            self._append_log(f"\n[{datetime.now():%H:%M:%S}] Validação concluída com sucesso.\n")
            self._set_status(self.execution_status, "Validado", "success")
            self._set_status(self.overall_status, "Pronto para publicar", "success")
        elif exit_code == 0 and mode == "publish":
            published_semester = self.semester
            self.validated_signature = None
            self.confirmation.setChecked(False)
            self.confirmation.setEnabled(False)
            self.imported_periods.add(published_semester)
            self._append_log(f"\n[{datetime.now():%H:%M:%S}] Publicação concluída com sucesso.\n")
            self._set_status(self.execution_status, "Publicado", "success")
            self._set_status(self.overall_status, f"{published_semester} publicado", "success")
            QMessageBox.information(
                self,
                "Publicação concluída",
                f"O semestre {published_semester} foi publicado com sucesso.",
            )
            self._start_database_worker(initialize=False)
        else:
            action = "validação" if mode == "validate" else "publicação"
            self.validated_signature = None
            self.confirmation.setChecked(False)
            self.confirmation.setEnabled(False)
            self._append_log(
                f"\n[{datetime.now():%H:%M:%S}] Falha na {action} (código {exit_code}).\n"
            )
            self._set_status(self.execution_status, "Falha", "error")
            self._set_status(self.overall_status, f"Falha na {action}", "error")
            QMessageBox.critical(
                self,
                f"Falha na {action}",
                "A operação não foi concluída. Consulte o registro para identificar a causa.",
            )

        self.process_mode = None
        self._refresh_controls()

    def _process_error(self, error) -> None:
        if error == QProcess.ProcessError.FailedToStart and self.process_mode:
            action = "validação" if self.process_mode == "validate" else "publicação"
            self._append_log(
                f"\n[{datetime.now():%H:%M:%S}] Não foi possível iniciar o processo Python: "
                f"{self.process.errorString()}\n"
            )

            self.progress.hide()
            self.validated_signature = None
            self.confirmation.setChecked(False)
            self.confirmation.setEnabled(False)
            self._set_status(self.execution_status, 'Falha', 'error')
            self._set_status(self.overall_status, f'Falha na {action}', 'error')
            self.process_mode = None
            self._refresh_controls()

    def _cancel_validation(self) -> None:
        if (
            self.process_mode != "validate"
            or self.process.state() == QProcess.ProcessState.NotRunning
        ):
            return
        self.process_was_cancelled = True
        self.process.kill()

    def _clear_log(self) -> None:
        if self.process.state() == QProcess.ProcessState.NotRunning:
            self.log.clear()

    def _append_log(self, message: str) -> None:
        self.log.appendPlainText(message)
        scrollbar = self.log.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())

    def _set_status(self, label: QLabel, text: str, kind: str) -> None:
        names = {
            "neutral": "statusNeutral",
            "success": "statusSuccess",
            "warning": "statusWarning",
            "error": "statusError",
        }
        label.setText(text)
        label.setObjectName(names[kind])
        label.style().unpolish(label)
        label.style().polish(label)

    def _refresh_controls(self, *_args) -> None:
        running = self.process.state() != QProcess.ProcessState.NotRunning
        checking_database = bool(self.database_worker and self.database_worker.isRunning())
        has_valid_inputs = self._current_signature() is not None
        current_signature = self._current_signature()
        validated = current_signature is not None and current_signature == self.validated_signature
        semester_available = self.semester not in self.imported_periods

        self.year_input.setEnabled(not running)
        self.period_input.setEnabled(not running)
        self.disc_picker.set_controls_enabled(not running)
        self.doc_picker.set_controls_enabled(not running)
        self.database_url.setEnabled(not running and not checking_database)
        self.reveal_url.setEnabled(not running and not checking_database)
        self.test_database_button.setEnabled(
            not running and not checking_database and bool(self.database_url.text().strip())
        )
        self.view_schema_button.setEnabled(not running)
        self.validate_button.setEnabled(not running and has_valid_inputs and semester_available)
        self.publish_button.setEnabled(
            not running
            and validated
            and self.database_ready
            and semester_available
            and self.confirmation.isChecked()
        )
        self.cancel_button.setEnabled(running and self.process_mode == "validate")
        
        self.btn_home.setEnabled(not running)
        self.btn_config.setEnabled(not running)
        self.btn_avalia.setEnabled(not running)

    def closeEvent(self, event: QCloseEvent) -> None:
        if self.process.state() == QProcess.ProcessState.NotRunning:
            event.accept()
            return
        if self.process_mode == "publish":
            QMessageBox.information(
                self,
                "Publicação em andamento",
                "Aguarde a conclusão da transação antes de fechar o aplicativo.",
            )
            event.ignore()
            return
        answer = QMessageBox.question(
            self,
            "Cancelar validação",
            "A validação ainda está em andamento. Deseja cancelá-la e fechar?",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No,
        )
        if answer == QMessageBox.Yes:
            self.process_was_cancelled = True
            self.process.kill()
            self.process.waitForFinished(3000)
            event.accept()
        else:
            event.ignore()

