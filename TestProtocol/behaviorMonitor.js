class BehaviorMonitor {
    constructor() {
        this.isActive = false;
        this.violations = {
            tabSwitch: 0,
            windowFocus: 0,
            keyboardShortcuts: 0,
            rightClick: 0,
            copyPaste: 0,
            devTools: 0,
            fullscreenExit: 0
        };
        this.eventListeners = [];
        this.suspiciousKeySequences = [];
        this.lastActivity = Date.now();
        this.devToolsCheckInterval = null;
        this.focusCheckInterval = null;
        
        // Comprehensive keyboard shortcuts to monitor
        this.monitoredShortcuts = {
            // Navigation shortcuts
            'Alt+Tab': { keys: ['Alt', 'Tab'], severity: 'high', description: 'Alt+Tab detected - window switching' },
            'Ctrl+Tab': { keys: ['Control', 'Tab'], severity: 'medium', description: 'Ctrl+Tab detected - tab switching' },
            'Ctrl+Shift+Tab': { keys: ['Control', 'Shift', 'Tab'], severity: 'medium', description: 'Ctrl+Shift+Tab detected - reverse tab switching' },
            'Cmd+Tab': { keys: ['Meta', 'Tab'], severity: 'high', description: 'Cmd+Tab detected - window switching (Mac)' },
            
            // Copy/Paste shortcuts
            'Ctrl+C': { keys: ['Control', 'c'], severity: 'critical', description: 'Copy operation detected' },
            'Ctrl+V': { keys: ['Control', 'v'], severity: 'critical', description: 'Paste operation detected' },
            'Ctrl+X': { keys: ['Control', 'x'], severity: 'critical', description: 'Cut operation detected' },
            'Ctrl+A': { keys: ['Control', 'a'], severity: 'medium', description: 'Select all detected' },
            'Cmd+C': { keys: ['Meta', 'c'], severity: 'critical', description: 'Copy operation detected (Mac)' },
            'Cmd+V': { keys: ['Meta', 'v'], severity: 'critical', description: 'Paste operation detected (Mac)' },
            'Cmd+X': { keys: ['Meta', 'x'], severity: 'critical', description: 'Cut operation detected (Mac)' },
            
            // Developer tools
            'F12': { keys: ['F12'], severity: 'critical', description: 'F12 pressed - Developer tools' },
            'Ctrl+Shift+I': { keys: ['Control', 'Shift', 'I'], severity: 'critical', description: 'Developer tools shortcut' },
            'Ctrl+Shift+J': { keys: ['Control', 'Shift', 'J'], severity: 'critical', description: 'Console shortcut' },
            'Ctrl+Shift+C': { keys: ['Control', 'Shift', 'C'], severity: 'critical', description: 'Element inspector shortcut' },
            'Ctrl+U': { keys: ['Control', 'u'], severity: 'high', description: 'View source shortcut' },
            'Cmd+Option+I': { keys: ['Meta', 'Alt', 'I'], severity: 'critical', description: 'Developer tools (Mac)' },
            'Cmd+Option+J': { keys: ['Meta', 'Alt', 'J'], severity: 'critical', description: 'Console (Mac)' },
            'Cmd+Option+C': { keys: ['Meta', 'Alt', 'C'], severity: 'critical', description: 'Element inspector (Mac)' },
            
            // System shortcuts
            'Alt+F4': { keys: ['Alt', 'F4'], severity: 'high', description: 'Alt+F4 - Close window' },
            'Ctrl+W': { keys: ['Control', 'w'], severity: 'high', description: 'Close tab shortcut' },
            'Ctrl+Shift+T': { keys: ['Control', 'Shift', 'T'], severity: 'medium', description: 'Reopen closed tab' },
            'Ctrl+R': { keys: ['Control', 'r'], severity: 'medium', description: 'Refresh page' },
            'F5': { keys: ['F5'], severity: 'medium', description: 'Refresh page' },
            'Ctrl+F5': { keys: ['Control', 'F5'], severity: 'medium', description: 'Hard refresh' },
            'Escape': { keys: ['Escape'], severity: 'medium', description: 'Escape key pressed' },
            
            // Print screen
            'PrintScreen': { keys: ['PrintScreen'], severity: 'high', description: 'Print screen detected' },
            'Alt+PrintScreen': { keys: ['Alt', 'PrintScreen'], severity: 'high', description: 'Alt+Print screen detected' },
            'Cmd+Shift+3': { keys: ['Meta', 'Shift', '3'], severity: 'high', description: 'Screenshot (Mac)' },
            'Cmd+Shift+4': { keys: ['Meta', 'Shift', '4'], severity: 'high', description: 'Partial screenshot (Mac)' },
            
            // Windows key
            'Windows': { keys: ['Meta'], severity: 'medium', description: 'Windows key pressed' },
            
            // Function keys
            'F1': { keys: ['F1'], severity: 'low', description: 'F1 help key' },
            'F2': { keys: ['F2'], severity: 'low', description: 'F2 rename key' },
            'F3': { keys: ['F3'], severity: 'low', description: 'F3 search key' },
            'F4': { keys: ['F4'], severity: 'low', description: 'F4 address bar' },
            'F6': { keys: ['F6'], severity: 'low', description: 'F6 address bar focus' },
            'F7': { keys: ['F7'], severity: 'low', description: 'F7 function key' },
            'F8': { keys: ['F8'], severity: 'low', description: 'F8 function key' },
            'F9': { keys: ['F9'], severity: 'low', description: 'F9 function key' },
            'F10': { keys: ['F10'], severity: 'low', description: 'F10 menu key' },
            'F11': { keys: ['F11'], severity: 'high', description: 'F11 fullscreen toggle' }
        };
        
        this.currentKeys = new Set();
        this.keySequenceTimeout = null;
    }

    /**
     * Initialize behavior monitoring
     */
    initialize() {
        if (this.isActive) {
            console.warn('Behavior monitor already active');
            return;
        }

        this.isActive = true;
        this.setupEventListeners();
        this.startDevToolsDetection();
        this.startFocusMonitoring();
        this.preventCopyPaste();
        
        console.log('Behavior monitoring initialized');
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Keyboard monitoring
        this.addListener(document, 'keydown', this.handleKeyDown.bind(this));
        this.addListener(document, 'keyup', this.handleKeyUp.bind(this));
        
        // Mouse monitoring
        this.addListener(document, 'contextmenu', this.handleRightClick.bind(this));
        this.addListener(document, 'mousedown', this.handleMouseDown.bind(this));
        
        // Window/Tab monitoring
        this.addListener(document, 'visibilitychange', this.handleVisibilityChange.bind(this));
        this.addListener(window, 'blur', this.handleWindowBlur.bind(this));
        this.addListener(window, 'focus', this.handleWindowFocus.bind(this));
        
        // Clipboard monitoring
        this.addListener(document, 'copy', this.handleCopy.bind(this));
        this.addListener(document, 'paste', this.handlePaste.bind(this));
        this.addListener(document, 'cut', this.handleCut.bind(this));
        
        // Fullscreen monitoring
        this.addListener(document, 'fullscreenchange', this.handleFullscreenChange.bind(this));
        this.addListener(document, 'webkitfullscreenchange', this.handleFullscreenChange.bind(this));
        this.addListener(document, 'mozfullscreenchange', this.handleFullscreenChange.bind(this));
        
        // Prevent common cheating methods
        this.addListener(window, 'beforeunload', this.handleBeforeUnload.bind(this));
        this.addListener(document, 'selectstart', this.handleTextSelection.bind(this));
        this.addListener(document, 'dragstart', this.handleDragStart.bind(this));
    }

    /**
     * Add event listener and track it
     */
    addListener(element, event, handler) {
        element.addEventListener(event, handler, true);
        this.eventListeners.push({ element, event, handler });
    }

    /**
     * Handle key down events
     */
    handleKeyDown(event) {
        this.lastActivity = Date.now();
        this.currentKeys.add(event.key);
        this.currentKeys.add(event.code);
        
        // Check for monitored shortcuts
        this.checkKeyboardShortcuts(event);
        
        // Log suspicious key sequences
        this.logKeySequence(event);
        
        // Prevent certain keys
        if (this.shouldPreventKey(event)) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    }

    /**
     * Handle key up events
     */
    handleKeyUp(event) {
        this.currentKeys.delete(event.key);
        this.currentKeys.delete(event.code);
    }

    /**
     * Check for keyboard shortcuts
     */
    checkKeyboardShortcuts(event) {
        for (const [shortcutName, shortcut] of Object.entries(this.monitoredShortcuts)) {
            if (this.isShortcutPressed(shortcut.keys, event)) {
                this.logViolation('keyboard_shortcut', shortcut.severity, shortcut.description, {
                    shortcut: shortcutName,
                    keys: shortcut.keys,
                    keyCode: event.keyCode,
                    altKey: event.altKey,
                    ctrlKey: event.ctrlKey,
                    shiftKey: event.shiftKey,
                    metaKey: event.metaKey
                });
                
                // Prevent the shortcut if it's critical
                if (shortcut.severity === 'critical') {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }
            }
        }
    }

    /**
     * Check if a specific shortcut is pressed
     */
    isShortcutPressed(keys, event) {
        // Handle single key shortcuts
        if (keys.length === 1) {
            return event.key === keys[0] || event.code === keys[0];
        }
        
        // Handle multi-key shortcuts
        const modifiers = {
            'Alt': event.altKey,
            'Control': event.ctrlKey,
            'Shift': event.shiftKey,
            'Meta': event.metaKey
        };
        
        for (const key of keys) {
            if (modifiers.hasOwnProperty(key)) {
                if (!modifiers[key]) return false;
            } else {
                if (event.key !== key && event.code !== key) return false;
            }
        }
        
        return true;
    }

    /**
     * Log key sequence for pattern analysis
     */
    logKeySequence(event) {
        this.suspiciousKeySequences.push({
            timestamp: Date.now(),
            key: event.key,
            code: event.code,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            metaKey: event.metaKey
        });
        
        // Keep only recent sequences (last 10 seconds)
        const cutoff = Date.now() - 10000;
        this.suspiciousKeySequences = this.suspiciousKeySequences.filter(seq => seq.timestamp > cutoff);
    }

    /**
     * Check if key should be prevented
     */
    shouldPreventKey(event) {
        // Prevent F12 (Developer Tools)
        if (event.key === 'F12') return true;
        
        // Prevent Ctrl+Shift+I (Developer Tools)
        if (event.ctrlKey && event.shiftKey && event.key === 'I') return true;
        
        // Prevent Ctrl+U (View Source)
        if (event.ctrlKey && event.key === 'u') return true;
        
        // Prevent right-click menu shortcut
        if (event.key === 'ContextMenu') return true;
        
        return false;
    }

    /**
     * Handle right-click events
     */
    handleRightClick(event) {
        event.preventDefault();
        
        this.logViolation('right_click', 'medium', 'Right-click detected', {
            x: event.clientX,
            y: event.clientY,
            target: event.target.tagName
        });
        
        return false;
    }

    /**
     * Handle mouse down events
     */
    handleMouseDown(event) {
        this.lastActivity = Date.now();
        
        // Log middle mouse button (often used for opening links in new tabs)
        if (event.button === 1) {
            this.logViolation('middle_click', 'medium', 'Middle mouse button detected', {
                x: event.clientX,
                y: event.clientY,
                target: event.target.tagName
            });
        }
    }

    /**
     * Handle visibility change (tab switching)
     */
    handleVisibilityChange() {
        if (document.hidden) {
            this.logViolation('tab_switch', 'high', 'Tab switched away from exam', {
                hidden: document.hidden,
                visibilityState: document.visibilityState
            });
        } else {
            this.logViolation('tab_return', 'medium', 'Returned to exam tab', {
                hidden: document.hidden,
                visibilityState: document.visibilityState
            });
        }
    }

    /**
     * Handle window blur (focus lost)
     */
    handleWindowBlur() {
        // Silently track window blur without UI notification
        this.logViolation('window_blur', 'high', 'Window lost focus', {
            timestamp: Date.now()
        }, false);
    }

    /**
     * Handle window focus (focus gained)
     */
    handleWindowFocus() {
        // Silently track window focus without UI notification
        this.logViolation('window_focus', 'medium', 'Window gained focus', {
            timestamp: Date.now()
        }, false);
    }

    /**
     * Handle copy events
     */
    handleCopy(event) {
        event.preventDefault();
        
        this.logViolation('copy_attempt', 'critical', 'Copy operation blocked', {
            selection: window.getSelection().toString().substring(0, 100)
        });
        
        return false;
    }

    /**
     * Handle paste events
     */
    handlePaste(event) {
        event.preventDefault();
        
        this.logViolation('paste_attempt', 'critical', 'Paste operation blocked', {
            clipboardData: event.clipboardData ? 'present' : 'absent'
        });
        
        return false;
    }

    /**
     * Handle cut events
     */
    handleCut(event) {
        event.preventDefault();
        
        this.logViolation('cut_attempt', 'critical', 'Cut operation blocked', {
            selection: window.getSelection().toString().substring(0, 100)
        });
        
        return false;
    }

    /**
     * Handle fullscreen changes
     */
    handleFullscreenChange() {
        const isFullscreen = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
        
        if (!isFullscreen) {
            this.logViolation('fullscreen_exit', 'high', 'Exited fullscreen mode', {
                timestamp: Date.now()
            });
        }
    }

    /**
     * Handle before unload (page refresh/close)
     */
    handleBeforeUnload(event) {
        this.logViolation('page_unload', 'high', 'Attempted to leave exam page', {
            timestamp: Date.now()
        });
        
        // Show warning
        const message = 'Are you sure you want to leave the exam? This will be logged as a violation.';
        event.returnValue = message;
        return message;
    }

    /**
     * Handle text selection
     */
    handleTextSelection(event) {
        // Allow selection in input fields and textareas
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return true;
        }
        
        // Prevent text selection elsewhere
        event.preventDefault();
        return false;
    }

    /**
     * Handle drag start
     */
    handleDragStart(event) {
        event.preventDefault();
        
        this.logViolation('drag_attempt', 'medium', 'Drag operation blocked', {
            target: event.target.tagName
        });
        
        return false;
    }

    /**
     * Start DevTools detection
     */
    startDevToolsDetection() {
        this.devToolsCheckInterval = setInterval(() => {
            this.checkDevTools();
        }, 1000);
    }

    /**
     * Check for DevTools
     */
    checkDevTools() {
        const threshold = 160;
        
        // Method 1: Check window size difference
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        // Method 2: Check console.log timing
        let devtools = false;
        const start = performance.now();
        console.log('%c', 'color: transparent');
        const end = performance.now();
        
        if (end - start > 100) {
            devtools = true;
        }
        
        // Method 3: Check for firebug
        if (window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) {
            devtools = true;
        }
        
        if (widthThreshold || heightThreshold || devtools) {
            this.logViolation('devtools_detected', 'critical', 'Developer tools detected', {
                method: widthThreshold || heightThreshold ? 'window_size' : 'console_timing',
                outerWidth: window.outerWidth,
                innerWidth: window.innerWidth,
                outerHeight: window.outerHeight,
                innerHeight: window.innerHeight
            });
        }
    }

    /**
     * Start focus monitoring
     */
    startFocusMonitoring() {
        this.focusCheckInterval = setInterval(() => {
            if (Date.now() - this.lastActivity > 30000) { // 30 seconds of inactivity
                this.logViolation('inactivity', 'medium', 'Extended period of inactivity detected', {
                    lastActivity: this.lastActivity,
                    inactiveDuration: Date.now() - this.lastActivity
                });
                this.lastActivity = Date.now(); // Reset to avoid spam
            }
        }, 10000);
    }

    /**
     * Prevent copy-paste operations
     */
    preventCopyPaste() {
        // Disable clipboard API
        if (navigator.clipboard) {
            const originalWriteText = navigator.clipboard.writeText;
            const originalReadText = navigator.clipboard.readText;
            
            navigator.clipboard.writeText = function() {
                console.warn('Clipboard write blocked');
                return Promise.reject(new Error('Clipboard access blocked during exam'));
            };
            
            navigator.clipboard.readText = function() {
                console.warn('Clipboard read blocked');
                return Promise.reject(new Error('Clipboard access blocked during exam'));
            };
        }
        
        // Disable text selection CSS
        const style = document.createElement('style');
        style.textContent = `
            * {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
            }
            input, textarea {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Log a violation
     */
    logViolation(type, severity, description, metadata = {}) {
        this.violations[type] = (this.violations[type] || 0) + 1;
        
        if (window.violationLogger) {
            window.violationLogger.logViolation(
                type,
                severity,
                description,
                {
                    ...metadata,
                    totalViolations: this.getTotalViolations(),
                    behaviorPattern: this.getRecentBehaviorPattern()
                }
            );
        }
        
        console.warn(`Behavior violation: ${type} - ${description}`, metadata);
    }

    /**
     * Get total violations count
     */
    getTotalViolations() {
        return Object.values(this.violations).reduce((sum, count) => sum + count, 0);
    }

    /**
     * Get recent behavior pattern
     */
    getRecentBehaviorPattern() {
        const recent = this.suspiciousKeySequences.slice(-5);
        return recent.map(seq => ({
            key: seq.key,
            timestamp: seq.timestamp,
            modifiers: {
                alt: seq.altKey,
                ctrl: seq.ctrlKey,
                shift: seq.shiftKey,
                meta: seq.metaKey
            }
        }));
    }

    /**
     * Get violation statistics
     */
    getStatistics() {
        return {
            violations: { ...this.violations },
            totalViolations: this.getTotalViolations(),
            isActive: this.isActive,
            lastActivity: this.lastActivity,
            recentKeySequences: this.suspiciousKeySequences.length
        };
    }

    /**
     * Stop monitoring
     */
    stop() {
        this.isActive = false;
        
        // Remove all event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler, true);
        });
        this.eventListeners = [];
        
        // Clear intervals
        if (this.devToolsCheckInterval) {
            clearInterval(this.devToolsCheckInterval);
        }
        
        if (this.focusCheckInterval) {
            clearInterval(this.focusCheckInterval);
        }
        
        console.log('Behavior monitoring stopped');
    }

    /**
     * Reset violation counts
     */
    resetViolations() {
        this.violations = {
            tabSwitch: 0,
            windowFocus: 0,
            keyboardShortcuts: 0,
            rightClick: 0,
            copyPaste: 0,
            devTools: 0,
            fullscreenExit: 0
        };
        this.suspiciousKeySequences = [];
    }
}

// Create and export singleton instance
window.behaviorMonitor = new BehaviorMonitor();
export default window.behaviorMonitor;