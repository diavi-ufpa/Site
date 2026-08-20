APP_STYLESHEET = """
QWidget {
    color: #101828;
    font-family: "Segoe UI", "Arial", sans-serif;
    font-size: 14px;
}

QMainWindow, QWidget#appRoot, QScrollArea, QScrollArea > QWidget > QWidget {
    background: #ffffff;
}

QWidget#sidebar {
    background: #f9fafb;
    border-right: 1px solid #e4e7ec;
}

QLabel#brandMark {
    color: #a33d06;
    font-size: 24px;
    font-weight: 800;
}

QLabel#brandSubtitle, QLabel#sidebarCaption, QLabel#mutedText,
QLabel#fieldHelp, QLabel#fileMeta {
    color: #667085;
}

QLabel#sidebarCaption {
    font-size: 12px;
    font-weight: 700;
}

QFrame#navSelected {
    background: #fff4eb;
    border: 1px solid #f7c9a5;
    border-radius: 10px;
}

QLabel#navTitle {
    color: #8f3508;
    font-weight: 700;
}

QLabel#pageTitle {
    color: #101828;
    font-size: 28px;
    font-weight: 750;
}

QLabel#sectionTitle {
    color: #101828;
    font-size: 18px;
    font-weight: 700;
}

QLabel#fieldLabel {
    color: #344054;
    font-weight: 650;
}

QFrame#panel, QFrame#filePicker, QFrame#logPanel {
    background: #ffffff;
    border: 1px solid #e4e7ec;
    border-radius: 12px;
}

QFrame#filePicker[dragActive="true"] {
    background: #fff7f0;
    border: 1px solid #b54708;
}

QLineEdit, QSpinBox, QComboBox {
    min-height: 38px;
    padding: 0 10px;
    border: 1px solid #98a2b3;
    border-radius: 8px;
    background: #ffffff;
    selection-background-color: #2563eb;
}

QLineEdit:focus, QSpinBox:focus, QComboBox:focus {
    border: 2px solid #2563eb;
    padding: 0 9px;
}

QLineEdit:disabled, QSpinBox:disabled, QComboBox:disabled {
    background: #f2f4f7;
    color: #667085;
}

QPushButton {
    min-height: 40px;
    padding: 0 15px;
    border-radius: 8px;
    border: 1px solid #d0d5dd;
    background: #ffffff;
    color: #344054;
    font-weight: 650;
}

QPushButton:hover {
    background: #f9fafb;
    border-color: #98a2b3;
}

QPushButton:focus {
    border: 2px solid #2563eb;
}

QPushButton#primaryButton {
    border-color: #a33d06;
    background: #a33d06;
    color: #ffffff;
}

QPushButton#primaryButton:hover {
    border-color: #7a2e08;
    background: #7a2e08;
}

QPushButton#secondaryButton {
    border-color: #b54708;
    color: #8f3508;
}

QPushButton#quietButton {
    min-height: 34px;
    padding: 0 11px;
}

QPushButton:disabled, QPushButton#primaryButton:disabled, QPushButton#secondaryButton:disabled {
    border-color: #e4e7ec;
    background: #f2f4f7;
    color: #98a2b3;
}

QLabel#statusNeutral, QLabel#statusSuccess, QLabel#statusWarning,
QLabel#statusError, QLabel#periodChip {
    padding: 5px 9px;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 700;
}

QLabel#statusNeutral {
    background: #f2f4f7;
    color: #475467;
}

QLabel#statusSuccess {
    background: #ecfdf3;
    color: #027a48;
}

QLabel#statusWarning {
    background: #fff4e5;
    color: #8f3508;
}

QLabel#statusError {
    background: #fef3f2;
    color: #b42318;
}

QLabel#periodChip {
    background: #eef4ff;
    color: #1849a9;
}

QPlainTextEdit {
    padding: 12px;
    border: 0;
    border-radius: 8px;
    background: #101828;
    color: #e4e7ec;
    font-family: "Cascadia Mono", "Consolas", monospace;
    font-size: 12px;
    selection-background-color: #344054;
}

QProgressBar {
    min-height: 6px;
    max-height: 6px;
    border: 0;
    border-radius: 3px;
    background: #e4e7ec;
}

QProgressBar::chunk {
    border-radius: 3px;
    background: #b54708;
}

QCheckBox {
    spacing: 8px;
    color: #344054;
}

QCheckBox::indicator {
    width: 18px;
    height: 18px;
}

QScrollArea {
    border: 0;
}

QToolTip {
    padding: 6px;
    border: 1px solid #d0d5dd;
    background: #ffffff;
    color: #101828;
}

QPushButton.navButton {
    text-align: left;
    border: none;
    background: transparent;
    color: #667085;
    font-weight: 600;
    padding: 10px 14px;
    border-radius: 8px;
    min-height: 20px;
}
QPushButton.navButton:hover {
    background: #f2f4f7;
    color: #101828;
}
QPushButton.navButton:checked {
    background: #fff4eb;
    color: #8f3508;
    border: 1px solid #f7c9a5;
}

QFrame.card {
    background: #ffffff;
    border: 1px solid #e4e7ec;
    border-radius: 12px;
}
QFrame.card:hover {
    border: 1px solid #b54708;
}
"""
