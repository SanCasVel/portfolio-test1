class UndoRedoManager {
    constructor(maxHistory = 100) {
        this.history = [''];
        this.currentIndex = 0;
        this.maxHistory = maxHistory;
    }
    
    push(state) {
        this.history = this.history.slice(0, this.currentIndex + 1);
        this.history.push(state);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.currentIndex++;
        }
    }
    
    undo() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return this.history[this.currentIndex];
        }
        return null;
    }
    
    redo() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            return this.history[this.currentIndex];
        }
        return null;
    }
    
    canUndo() {
        return this.currentIndex > 0;
    }
    
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }
    
    reset() {
        this.history = [''];
        this.currentIndex = 0;
    }
}

// ============================================================
// SECCIÓN 1: Undo/Redo - historial de cambios
// ============================================================

class TextEditor {
    constructor() {
        this.editor = document.getElementById('editor');
        this.fileInput = document.getElementById('fileInput');
        this.nativeFileInput = document.getElementById('nativeFileInput');
        this.fileName = document.getElementById('fileName');
        this.unsavedIndicator = document.getElementById('unsavedIndicator');
        this.editorWrapper = document.getElementById('editorWrapper');
        this.editorContainer = document.getElementById('editorContainer');
        this.lineCount = document.getElementById('lineCount');
        this.charCount = document.getElementById('charCount');
        this.position = document.getElementById('position');
        this.statusBar = document.getElementById('statusBar');
        this.themeToggleMenu = document.getElementById('themeToggleMenu');
        this.orientationToggle = document.getElementById('orientationToggle');
        this.undoTool = document.getElementById('undoTool');
        this.redoTool = document.getElementById('redoTool');
        
        this.currentFile = null;
        this.currentFileHandle = null;
        this.hasUnsavedChanges = false;
        this.isBrightTheme = false;
        this.isLandscape = false;
        this.listMode = 'none';
        
        this.undoRedoManager = new UndoRedoManager();
        this.inputTimeout = null;
        
        this.init();
    }
    
    init() {
        this.loadPreferences();
        this.setupEventListeners();
        this.updateStatus();
        this.updateUndoRedoButtons();
    }
    
    // ------------------------------------------------------------
    // SECCIÓN 2: Preferencias de usuario y tema
    // ------------------------------------------------------------
    
    loadPreferences() {
        const savedFont = localStorage.getItem('editorFont') || "'Segoe UI', sans-serif";
        const savedSize = localStorage.getItem('editorFontSize') || '14';
        const savedColor = localStorage.getItem('editorTextColor') || '#000000';
        const savedTheme = localStorage.getItem('editorTheme') || 'dark';
        const savedOrientation = localStorage.getItem('editorOrientation') || 'portrait';
        
        this.editor.style.fontFamily = savedFont;
        this.editor.style.fontSize = savedSize + 'px';
        this.editor.style.color = savedColor;
        
        document.getElementById('fontSelect').value = savedFont;
        document.getElementById('fontSizeSelect').value = savedSize;
        document.getElementById('textColorInput').value = savedColor;
        
        if (savedTheme === 'bright' || savedTheme === 'light') {
            this.isBrightTheme = true;
            document.body.classList.add('bright-theme');
            if (this.themeToggleMenu) {
                this.themeToggleMenu.title = 'Alternar tema (actual: claro)';
                this.themeToggleMenu.setAttribute('aria-label', 'Alternar tema (claro)');
            }
        } else {
            if (this.themeToggleMenu) {
                this.themeToggleMenu.title = 'Alternar tema (actual: oscuro)';
                this.themeToggleMenu.setAttribute('aria-label', 'Alternar tema (oscuro)');
            }
        }
        
        if (savedOrientation === 'landscape') {
            this.isLandscape = true;
            this.editorContainer.classList.add('landscape');
            this.orientationToggle.title = 'Orientación: Horizontal';
            this.orientationToggle.setAttribute('aria-label', 'Orientación: Horizontal');
        }

        this.updateToolbarIcons();
    }
    
    savePreferences() {
        const font = document.getElementById('fontSelect').value;
        const size = document.getElementById('fontSizeSelect').value;
        const color = document.getElementById('textColorInput').value;
        const theme = this.isBrightTheme ? 'bright' : 'dark';
        const orientation = this.isLandscape ? 'landscape' : 'portrait';
        
        localStorage.setItem('editorFont', font);
        localStorage.setItem('editorFontSize', size);
        localStorage.setItem('editorTextColor', color);
        localStorage.setItem('editorTheme', theme);
        localStorage.setItem('editorOrientation', orientation);
    }
    
    setupEventListeners() {
        this.editor.addEventListener('input', () => this.onEditorInput());

        // Atajos de teclado del editor: Tab / Shift+Tab y Ctrl+S / Cmd+S para guardar documento.
        this.editor.addEventListener('keydown', (e) => {
            // Guardar con Ctrl+S / Cmd+S
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                e.stopPropagation();
                this.saveFile();
                return;
            }

            // Tabulación dentro del editor
            if (e.key === 'Tab') {
                e.preventDefault();
                if (e.shiftKey) {
                    document.execCommand('outdent');
                } else {
                    document.execCommand('insertText', false, '\t');
                }
                this.onEditorInput();
            }
        }, { passive: false });

        this.editor.addEventListener('click', () => this.updateStatus());
        
        this.editorWrapper.addEventListener('dragover', (e) => this.onDragOver(e));
        this.editorWrapper.addEventListener('dragleave', (e) => this.onDragLeave(e));
        this.editorWrapper.addEventListener('drop', (e) => this.onDrop(e));
        
        document.getElementById('fontSelect').addEventListener('change', (e) => {
            this.editor.style.fontFamily = e.target.value;
            this.savePreferences();
        });
        
        document.getElementById('fontSizeSelect').addEventListener('change', (e) => {
            this.editor.style.fontSize = e.target.value + 'px';
            this.savePreferences();
        });
        
        document.getElementById('textColorInput').addEventListener('change', (e) => {
            this.editor.style.color = e.target.value;
            this.savePreferences();
        });
        
        if (this.themeToggleMenu) {
            this.themeToggleMenu.addEventListener('click', () => this.toggleTheme());
        }
        this.orientationToggle.addEventListener('click', () => this.toggleOrientation());
        
        this.setupMenuButtons();
        this.setupToolbarButtons();
        this.setupMenuDropdowns();
        
        this.fileInput.addEventListener('change', (e) => this.onFileInputChange(e));
        this.nativeFileInput.addEventListener('change', (e) => this.onFileInputChange(e));
        
        window.addEventListener('beforeunload', (e) => this.onBeforeUnload(e));
    }
    
    // ------------------------------------------------------------
    // SECCIÓN 3: Menús desplegables (archivo, editar, vista, formato)
    // ------------------------------------------------------------
    
    setupMenuDropdowns() {
        const menus = [
            { btn: document.getElementById('fileMenu'), dropdown: document.getElementById('fileDropdown') },
            { btn: document.getElementById('editMenu'), dropdown: document.getElementById('editDropdown') },
            { btn: document.getElementById('viewMenu'), dropdown: document.getElementById('viewDropdown') },
            { btn: document.getElementById('formatMenu'), dropdown: document.getElementById('formatDropdown') }
        ];

        const closeAll = () => {
            menus.forEach(m => m.dropdown.hidden = true);
        };

        menus.forEach(({ btn, dropdown }) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const shouldOpen = dropdown.hidden;
                closeAll();

                if (shouldOpen && menuContainer) {
                    const btnRect = btn.getBoundingClientRect();
                    const containerRect = menuContainer.getBoundingClientRect();
                    dropdown.style.left = `${btnRect.left - containerRect.left}px`;
                    dropdown.style.top = `${btnRect.bottom - containerRect.top}px`;
                    dropdown.style.minWidth = `${btnRect.width}px`;
                }

                dropdown.hidden = !shouldOpen;
            });

            dropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        const menuContainer = document.querySelector('.menu-container');
        let closeTimeout = null;
        if (menuContainer) {
            menuContainer.addEventListener('mouseleave', () => {
                closeTimeout = setTimeout(() => closeAll(), 150);
            });
            menuContainer.addEventListener('mouseenter', () => {
                if (closeTimeout) {
                    clearTimeout(closeTimeout);
                    closeTimeout = null;
                }
            });
        }

        document.addEventListener('click', (e) => {
            const isClickInsideMenu = menus.some(({ btn, dropdown }) => 
                btn.contains(e.target) || dropdown.contains(e.target)
            );

            if (!isClickInsideMenu) {
                closeAll();
            }
        });
    }
    
    setupMenuButtons() {
        document.getElementById('openBtn').addEventListener('click', () => this.openFileDialog());
        document.getElementById('openNativeBtn').addEventListener('click', () => this.openFileNative());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveFile());
        document.getElementById('saveNativeBtn').addEventListener('click', () => this.saveFileNative());
        document.getElementById('saveAsBtn').addEventListener('click', () => this.saveAsFile());
        document.getElementById('newBtn').addEventListener('click', () => this.newFile());
        
        document.getElementById('copyBtn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('pasteBtn').addEventListener('click', () => this.pasteFromClipboard());
        document.getElementById('cutBtn').addEventListener('click', () => this.cutToClipboard());
        document.getElementById('selectAllBtn').addEventListener('click', () => this.selectAll());
        
        document.getElementById('wordWrapBtn').addEventListener('click', () => this.toggleWordWrap());
        document.getElementById('statusBarToggleBtn').addEventListener('click', () => this.toggleStatusBar());
    }
    
    setupToolbarButtons() {
        // ------------------------------------------------------------
        // SECCIÓN 4: Barra de herramientas (botones de acción rápida)
        // ------------------------------------------------------------
        document.getElementById('newFileTool').addEventListener('click', () => this.newFile());
        document.getElementById('openFileTool').addEventListener('click', () => this.openFileDialog());
        document.getElementById('saveFileTool').addEventListener('click', () => this.saveFile());
        
        document.getElementById('copyTool').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('pasteTool').addEventListener('click', () => this.pasteFromClipboard());
        document.getElementById('cutTool').addEventListener('click', () => this.cutToClipboard());
        
        document.getElementById('boldTool').addEventListener('click', () => this.toggleBold());
        document.getElementById('italicTool').addEventListener('click', () => this.toggleItalic());
        document.getElementById('underlineTool').addEventListener('click', () => this.toggleUnderline());
        document.getElementById('highlightTool').addEventListener('click', () => this.toggleHighlight());
        
        document.getElementById('alignLeftTool').addEventListener('click', () => this.alignLeft());
        document.getElementById('alignCenterTool').addEventListener('click', () => this.alignCenter());
        document.getElementById('alignRightTool').addEventListener('click', () => this.alignRight());
        document.getElementById('alignJustifyTool').addEventListener('click', () => this.alignJustify());
        document.getElementById('listToggleTool').addEventListener('click', () => this.toggleList());
        
        document.getElementById('undoTool').addEventListener('click', () => this.undo());
        document.getElementById('redoTool').addEventListener('click', () => this.redo());
    }
    
    // ------------------------------------------------------------
    // SECCIÓN 5: Operaciones del editor (lectura y escritura de texto)
    // ------------------------------------------------------------
    getEditorRaw() {
        return this.editor.innerHTML;
    }

    getEditorText() {
        return this.editor.textContent || '';
    }

    setEditorText(text) {
        this.editor.textContent = text;
    }

    onEditorInput() {
        if (!this.hasUnsavedChanges) {
            this.hasUnsavedChanges = true;
            this.updateFileNameDisplay();
        }
        
        clearTimeout(this.inputTimeout);
        this.inputTimeout = setTimeout(() => {
            this.undoRedoManager.push(this.getEditorRaw());
            this.updateUndoRedoButtons();
        }, 300);
        
        this.updateStatus();
    }
    
    // ------------------------------------------------------------
    // SECCIÓN 6: Atajos de texto (solo Tab para editor)
    // ------------------------------------------------------------
    // En Opera GX se elimina el uso de Ctrl/Cmd para evitar conflicto con atajos de navegador.
    // El resto de comandos se usan desde botones o menús.
    
    
    // ------------------------------------------------------------
    // SECCIÓN 7: Gestión de archivos (abrir, guardar, arrastrar y soltar)
    // ------------------------------------------------------------
    openFileDialog() {
        this.fileInput.click();
    }
    
    async openFileNative() {
        if (!window.showOpenFilePicker) {
            alert('File System Access API no está soportado en este navegador. Usa la opción "Abrir" en lugar de esta.');
            return;
        }
        
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [
                    {
                        description: 'Text Files',
                        accept: {
                            'text/plain': ['.txt', '.text', '.log', '.md', '.csv', '.html', '.css', '.js', '.json', '.xml']
                        }
                    }
                ],
                multiple: false
            });
            
            this.currentFileHandle = fileHandle;
            const file = await fileHandle.getFile();
            const content = await file.text();
            
            this.loadFileContent(content, file.name);
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error abriendo archivo:', err);
            }
        }
    }
    
    async onFileInputChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const content = await file.text();
            this.loadFileContent(content, file.name);
        } catch (err) {
            try {
                const content = await this.readFileWithFileReader(file);
                this.loadFileContent(content, file.name);
            } catch (error) {
                alert('Error al leer el archivo: ' + error.message);
            }
        }
        
        e.target.value = '';
    }
    
    readFileWithFileReader(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }
    
    loadFileContent(content, fileName) {
        this.setEditorText(content);
        this.currentFile = fileName;
        this.currentFileHandle = null;
        this.hasUnsavedChanges = false;
        this.undoRedoManager.reset();
        this.undoRedoManager.push(this.getEditorRaw());
        this.updateFileNameDisplay();
        this.updateStatus();
        this.updateUndoRedoButtons();
        this.editor.focus();
    }
    
    onDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.editorWrapper.classList.add('drag-over');
    }
    
    onDragLeave(e) {
        if (e.target === this.editorWrapper) {
            this.editorWrapper.classList.remove('drag-over');
        }
    }
    
    async onDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.editorWrapper.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length === 0) return;
        
        const file = files[0];
        try {
            const content = await file.text();
            this.loadFileContent(content, file.name);
        } catch (err) {
            try {
                const content = await this.readFileWithFileReader(file);
                this.loadFileContent(content, file.name);
            } catch (error) {
                alert('Error al leer el archivo: ' + error.message);
            }
        }
    }
    
    // ------------------------------------------------------------
    // SECCIÓN 7-A: Ayuda de nombre/extension de archivos
    // ------------------------------------------------------------
    getFileExtension(fileName) {
        const idx = fileName.lastIndexOf('.');
        return idx > 0 ? fileName.substring(idx + 1).toLowerCase() : '';
    }

    getMimeTypeForExtension(ext) {
        const mimeTypes = {
            txt: 'text/plain',
            md: 'text/markdown',
            html: 'text/html',
            js: 'application/javascript',
            json: 'application/json',
            css: 'text/css',
            csv: 'text/csv',
            xml: 'application/xml',
            pdf: 'application/pdf'
        };
        return mimeTypes[ext] || 'text/plain';
    }

    async saveFile() {
        if (!this.currentFile) {
            this.saveAsFile();
            return;
        }

        const currentExt = this.getFileExtension(this.currentFile) || 'txt';
        const mimeType = this.getMimeTypeForExtension(currentExt);

        if (this.currentFileHandle) {
            try {
                const writable = await this.currentFileHandle.createWritable();
                await writable.write(this.getEditorText());
                await writable.close();
                this.hasUnsavedChanges = false;
                this.updateFileNameDisplay();
                alert('Archivo guardado exitosamente');
            } catch (err) {
                console.error('Error guardando archivo:', err);
            }
        } else {
            this.saveAsBlob(mimeType);
        }
    }
    
    async saveFileNative() {
        if (!window.showSaveFilePicker) {
            alert('File System Access API no está soportado en este navegador. Usa la opción "Guardar Como" en lugar de esta.');
            return;
        }
        
        try {
            const suggestedName = this.currentFile || 'documento.txt';
            const currentExt = this.getFileExtension(suggestedName) || 'txt';
            const mimeType = this.getMimeTypeForExtension(currentExt);

            const acceptTypes = {};
            acceptTypes[mimeType] = ['.' + currentExt];

            const fileHandle = await window.showSaveFilePicker({
                suggestedName,
                types: [
                    {
                        description: 'Archivos',
                        accept: acceptTypes
                    }
                ]
            });
            
            const writable = await fileHandle.createWritable();
            await writable.write(this.getEditorText());
            await writable.close();
            
            this.currentFileHandle = fileHandle;
            this.currentFile = fileHandle.name;
            this.hasUnsavedChanges = false;
            this.updateFileNameDisplay();
            alert('Archivo guardado exitosamente');
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error guardando archivo:', err);
            }
        }
    }
    
    saveAsFile() {
        const defaultFileName = this.currentFile || 'documento.txt';
        const defaultBase = defaultFileName.replace(/\.[^/.]+$/, '');
        const defaultExt = this.getFileExtension(defaultFileName) || 'txt';

        const fileNameBase = prompt('Nombre del archivo (sin extensión):', defaultBase);
        if (!fileNameBase) return;

        let fileExt = prompt('Extensión (txt, pdf, html, js, json, etc.):', defaultExt);
        if (!fileExt) fileExt = 'txt';
        fileExt = fileExt.trim().replace(/^[.]+/, '').toLowerCase();
        if (!fileExt) fileExt = 'txt';

        this.currentFile = `${fileNameBase}.${fileExt}`;
        this.hasUnsavedChanges = false;
        this.updateFileNameDisplay();

        const mimeType = this.getMimeTypeForExtension(fileExt);
        this.saveAsBlob(mimeType);
    }

    saveAsBlob(mimeType = 'text/plain') {
        const blob = new Blob([this.getEditorText()], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.currentFile || 'documento.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    newFile() {
        if (this.hasUnsavedChanges) {
            if (!confirm('Hay cambios sin guardar. ¿Deseas continuar sin guardar?')) {
                return;
            }
        }
        
        this.setEditorText('');
        this.currentFile = null;
        this.currentFileHandle = null;
        this.hasUnsavedChanges = false;
        this.undoRedoManager.reset();
        this.updateFileNameDisplay();
        this.updateStatus();
        this.updateUndoRedoButtons();
    }
    
    async copyToClipboard() {
        const selection = window.getSelection();
        const selected = selection ? selection.toString() : '';
        
        if (!selected) {
            alert('No hay texto seleccionado para copiar');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(selected);
            alert('Copiado al portapapeles');
        } catch (err) {
            console.error('Error copiando:', err);
        }
    }
    
    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
        document.execCommand('insertText', false, text);
        } catch (err) {
            console.error('Error pegando:', err);
        }
    }
    
    cutToClipboard() {
        const selection = window.getSelection();
        const selected = selection ? selection.toString() : '';
        
        if (!selected) {
            alert('No hay texto seleccionado para cortar');
            return;
        }
        
        navigator.clipboard.writeText(selected).then(() => {
            document.execCommand('delete');
            this.onEditorInput();
            alert('Cortado al portapapeles');
        }).catch(err => {
            console.error('Error cortando:', err);
        });
    }
    
    selectAll() {
        this.editor.select();
    }
    
    toggleWordWrap() {
        this.editor.classList.toggle('word-wrap');
        this.editor.classList.toggle('no-wrap');
    }
    
    toggleStatusBar() {
        this.statusBar.toggleAttribute('hidden');
    }
    
    updateFileNameDisplay() {
        if (this.currentFile) {
            this.fileName.textContent = this.currentFile;
        } else {
            this.fileName.textContent = 'Sin título';
        }
        
        if (this.hasUnsavedChanges) {
            this.unsavedIndicator.removeAttribute('hidden');
        } else {
            this.unsavedIndicator.setAttribute('hidden', '');
        }
    }
    
    updateStatus() {
        const text = this.getEditorText();
        const lines = text === '' ? 1 : text.split('\n').length;
        const chars = text.length;

        // Cursor position is approximate for contenteditable, use selection focus offset
        const selection = window.getSelection();
        let line = 1;
        let column = 1;

        if (selection && selection.focusNode && this.editor.contains(selection.focusNode)) {
            const range = selection.getRangeAt(0);
            const preRange = document.createRange();
            preRange.selectNodeContents(this.editor);
            preRange.setEnd(range.endContainer, range.endOffset);
            const preText = preRange.toString();
            line = preText.split('\n').length;
            const lastNewline = preText.lastIndexOf('\n');
            column = lastNewline === -1 ? preText.length + 1 : preText.length - lastNewline;
        }

        this.lineCount.textContent = lines;
        this.charCount.textContent = chars;
        this.position.textContent = `${line}:${column}`;
    }
    
    toggleOrientation() {
        this.isLandscape = !this.isLandscape;
        if (this.isLandscape) {
            this.editorContainer.classList.add('landscape');
            this.orientationToggle.title = 'Orientación: Horizontal';
            this.orientationToggle.setAttribute('aria-label', 'Orientación: Horizontal');
        } else {
            this.editorContainer.classList.remove('landscape');
            this.orientationToggle.title = 'Orientación: Vertical';
            this.orientationToggle.setAttribute('aria-label', 'Orientación: Vertical');
        }
        this.savePreferences();
    }
    
    undo() {
        clearTimeout(this.inputTimeout);
        const previousState = this.undoRedoManager.undo();
        if (previousState !== null) {
            this.editor.innerHTML = previousState;
            this.updateStatus();
            this.updateUndoRedoButtons();
        }
    }
    
    redo() {
        clearTimeout(this.inputTimeout);
        const nextState = this.undoRedoManager.redo();
        if (nextState !== null) {
            this.editor.innerHTML = nextState;
            this.updateStatus();
            this.updateUndoRedoButtons();
        }
    }
    
    updateUndoRedoButtons() {
        this.undoTool.disabled = !this.undoRedoManager.canUndo();
        this.redoTool.disabled = !this.undoRedoManager.canRedo();
    }

    updateToolbarIcons() {
        const isBright = this.isBrightTheme;
        document.querySelectorAll('.tool-icon').forEach(img => {
            const lightSrc = img.dataset.iconLight;
            const darkSrc = img.dataset.iconDark;
            if (!lightSrc && !darkSrc) return;
            // In bright (light) theme we use the darker icons for contrast;
            // in the default dark palette we use the bright versions.
            img.src = isBright ? (darkSrc || lightSrc) : (lightSrc || darkSrc);
        });
    }
    
    toggleTheme() {
        this.isBrightTheme = !this.isBrightTheme;
        if (this.isBrightTheme) {
            document.body.classList.add('bright-theme');
            if (this.themeToggleMenu) {
                this.themeToggleMenu.title = 'Alternar tema (actual: claro)';
                this.themeToggleMenu.setAttribute('aria-label', 'Alternar tema (claro)');
            }
        } else {
            document.body.classList.remove('bright-theme');
            if (this.themeToggleMenu) {
                this.themeToggleMenu.title = 'Alternar tema (actual: oscuro)';
                this.themeToggleMenu.setAttribute('aria-label', 'Alternar tema (oscuro)');
            }
        }
        this.updateToolbarIcons();
        this.savePreferences();
    }

    toggleBold() {
        document.execCommand('bold');
        this.onEditorInput();
    }

    toggleItalic() {
        document.execCommand('italic');
        this.onEditorInput();
    }

    toggleUnderline() {
        document.execCommand('underline');
        this.onEditorInput();
    }

    toggleHighlight() {
        // Using background color change via command
        document.execCommand('hiliteColor', false, '#ffff00');
        this.onEditorInput();
    }

    alignLeft() {
        document.execCommand('justifyLeft');
        this.onEditorInput();
    }

    alignCenter() {
        document.execCommand('justifyCenter');
        this.onEditorInput();
    }

    alignRight() {
        document.execCommand('justifyRight');
        this.onEditorInput();
    }

    alignJustify() {
        document.execCommand('justifyFull');
        this.onEditorInput();
    }

    getCurrentListType() {
        const selection = window.getSelection();
        if (!selection || !selection.focusNode) return null;

        let node = selection.focusNode;
        while (node && node !== this.editor) {
            if (node.nodeName === 'UL') return 'unordered';
            if (node.nodeName === 'OL') return 'ordered';
            node = node.parentNode;
        }

        return null;
    }

    toggleList() {
        const current = this.getCurrentListType();

        // Cycle: none -> unordered -> ordered -> none
        if (current === null) {
            document.execCommand('insertUnorderedList');
            document.execCommand('indent');
            this.listMode = 'unordered';
        } else if (current === 'unordered') {
            document.execCommand('insertOrderedList');
            this.listMode = 'ordered';
        } else {
            // If already ordered, remove list + outdent
            document.execCommand('outdent');
            // If still in a list, outdent again until list removed
            for (let i = 0; i < 3 && this.getCurrentListType() !== null; i++) {
                document.execCommand('outdent');
            }
            this.listMode = 'none';
        }

        // Keep focus in editor after applying
        this.editor.focus();
        this.onEditorInput();
    }
    
    onBeforeUnload(e) {
        if (this.hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TextEditor();
});
