document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    const addVitalsBtn = document.getElementById('addVitalsBtn');
    const vitalsContainer = document.getElementById('vitals-sets-container');
    const generateBtn = document.getElementById('generateBtn');
    const copyButton = document.getElementById('copyButton');
    const clearButton = document.getElementById('clearButton');
    const clearModal = document.getElementById('clearModal');
    const confirmClearBtn = document.getElementById('confirmClearBtn');
    const cancelClearBtn = document.getElementById('cancelClearBtn');
    const progressFill = document.getElementById('progressFill');
    const soapOutput = document.getElementById('soapOutput');
    const outputActions = document.getElementById('outputActions');

    let vitalsSetCounter = 0;

    // ==========================================================================
    // VITAL SIGNS MANAGEMENT
    // ==========================================================================

    /**
     * Creates and adds a new set of vital signs inputs to the page.
     * @param {boolean} isFirstSet - If true, the set is created without a remove button.
     * @param {object} [data={}] - Optional data to populate the new set with.
     */
    function addVitalsSet(isFirstSet = false, data = {}) {
        vitalsSetCounter++;
        const setWrapper = document.createElement('div');
        setWrapper.className = 'vitals-set';

        // Add the 'x' button ONLY if it's not the first set
        if (!isFirstSet) {
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-vitals-btn';
            removeBtn.innerHTML = '&times;'; // '×' symbol
            removeBtn.setAttribute('aria-label', 'Remove this vitals set');
            removeBtn.addEventListener('click', () => {
                setWrapper.remove();
                updateProgress(); // Update progress after removing a set
            });
            setWrapper.appendChild(removeBtn);
        }

        // Create the HTML for the input fields
        const setContent = document.createElement('div');
        setContent.className = 'vitals-grid';
        setContent.innerHTML = `
            <div class="vital-item time-item">
                <label>Time:</label>
                <input type="text" class="vitals-time" placeholder="8:30 AM" value="${data.time || ''}" pattern="\\d{1,2}:\\d{2}\\s[APap][Mm]">
                <button type="button" class="set-time-btn">Now</button>
            </div>
            <div class="vital-item">
                <label>Heart Rate:</label>
                <input type="number" class="vitals-hr" placeholder="BPM" value="${data.hr || ''}" min="0" max="300">
            </div>
            <div class="vital-item">
                <label>Resp Rate:</label>
                <input type="number" class="vitals-rr" placeholder="16" value="${data.rr || ''}" min="0" max="60">
            </div>
            <div class="vital-item">
                <label>Blood Pressure:</label>
                <input type="text" class="vitals-bp" placeholder="120/80" value="${data.bp || ''}" pattern="\\d{1,3}/\\d{1,3}">
            </div>
            <div class="vital-item">
                <label>SCTM:</label>
                <input type="text" class="vitals-sctm" placeholder="Pink, warm, dry" value="${data.sctm || ''}">
            </div>
            <div class="vital-item">
                <label>PERRL:</label>
                <input type="text" class="vitals-perrl" placeholder="3mm reactive" value="${data.perrl || ''}">
            </div>
            <div class="vital-item">
                <label>Temperature:</label>
                <input type="text" class="vitals-temp" placeholder="98.6/Normal" value="${data.temp || ''}">
            </div>
        `;
        setWrapper.appendChild(setContent);
        vitalsContainer.appendChild(setWrapper);

        // Add event listeners for the new elements
        setWrapper.querySelector('.set-time-btn').addEventListener('click', (e) => setCurrentTime(e.target));
        setWrapper.querySelectorAll('input').forEach(input => input.addEventListener('input', updateProgress));
    }

    /**
     * Sets the current time in a vitals set time field.
     */
    function setCurrentTime(button) {
        const timeInput = button.parentElement.querySelector('.vitals-time');
        const now = new Date();
        const options = { hour: 'numeric', minute: '2-digit', hour12: true };
        timeInput.value = now.toLocaleTimeString('en-US', options).replace(/ /g, ' ');
        timeInput.dispatchEvent(new Event('input', { bubbles: true })); // Ensure progress updates
    }


    // ==========================================================================
    // FORM PROGRESS & DATA HANDLING
    // ==========================================================================

    /**
     * Updates the progress bar based on how many fields are filled out.
     */
    function updateProgress() {
        const fields = document.querySelectorAll('.content input[type="text"], .content input[type="number"], .content textarea, .content select');
        const totalFields = fields.length + 1; // +1 for the radio button group

        let filledCount = 0;
        fields.forEach(field => {
            if (field.value.trim() !== '') {
                filledCount++;
            }
        });

        if (document.querySelector('input[name="vitalsStatus"]:checked')) {
            filledCount++;
        }

        const progress = totalFields > 0 ? (filledCount / totalFields) * 100 : 0;
        progressFill.style.width = `${progress}%`;
    }

    /**
     * Clears the entire form, localStorage, and resets the view.
     */
    function clearForm() {
        document.querySelectorAll('input[type="text"], input[type="number"], textarea, select').forEach(input => input.value = '');
        document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);

        vitalsContainer.innerHTML = '';
        addVitalsSet(true); // Add back one clean, non-removable set

        soapOutput.classList.add('hidden');
        outputActions.classList.add('hidden');
        clearModal.style.display = 'none';

        localStorage.removeItem('wildernessSoapNote');
        updateProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }


    // ==========================================================================
    // REPORT GENERATION & ACTIONS
    // ==========================================================================
    
    /**
     * Generates the final SOAP note text from all form fields.
     */
    function generateSOAP() {
        let vitalsDetails = '';
        const vitalsSets = document.querySelectorAll('.vitals-set');

        vitalsSets.forEach((set, index) => {
            const time = set.querySelector('.vitals-time').value.trim() || '[No time]';
            const hr = set.querySelector('.vitals-hr').value.trim() || 'N/A';
            const rr = set.querySelector('.vitals-rr').value.trim() || 'N/A';
            const bp = set.querySelector('.vitals-bp').value.trim() || 'N/A';
            const sctm = set.querySelector('.vitals-sctm').value.trim() || 'N/A';
            const perrl = set.querySelector('.vitals-perrl').value.trim() || 'N/A';
            const temp = set.querySelector('.vitals-temp').value.trim() || 'N/A';

            vitalsDetails += `
  Set ${index + 1} at ${time}:
  • HR: ${hr} | RR: ${rr} | BP: ${bp}
  • SCTM: ${sctm} | PERRL: ${perrl} | Temp: ${temp}`;
        });

        if (vitalsSets.length === 0) {
            vitalsDetails = '\n  [No vitals recorded]';
        }

        const getValue = (id) => document.getElementById(id).value.trim() || '[Not documented]';
        const vitalsStatus = document.querySelector('input[name="vitalsStatus"]:checked')?.value || '[Not documented]';

        const soapNote = `
WILDERNESS SOAP NOTE
====================
SUBJECTIVE:
-----------
Rescuer: ${getValue('rescuerName')}
Patient: ${getValue('patientInfo')}

OPQRST Assessment:
• Onset: ${getValue('onset')}
• Provocation/Palliation: ${getValue('provocation')}
• Quality: ${getValue('quality')}
• Radiation/Region: ${getValue('radiation')}
• Severity: ${getValue('severity')}
• Time: ${getValue('time')}

Mechanism of Injury/HPI: ${getValue('moiHpi')}
Current Level of Responsiveness: ${getValue('lor')}

OBJECTIVE:
----------
Head-to-Toe Findings: ${getValue('headToToe')}
Position Found: ${getValue('foundPosition')}
Pertinent Negatives: ${getValue('pertinentNegatives')}

Vital Signs Details:${vitalsDetails}
Overall Vitals Trend: ${vitalsStatus}

SAMPLE History:
• Signs/Symptoms: ${getValue('symptoms')}
• Allergies: ${getValue('allergies')}
• Medications: ${getValue('medications')}
• Pertinent History: ${getValue('pertinentHistory')}
• Last Ins/Outs: ${getValue('lastInsOuts')}
• Events: ${getValue('events')}

ASSESSMENT:
-----------
Problem List: ${getValue('problemList')}
Spine Injury Assessment: ${getValue('spineAssessment')}

PLAN:
-----
Treatment Plan: ${getValue('treatments')}
Evacuation Plan: ${getValue('evacuation')}
Support Requested: ${getValue('support')}
Anticipated Problems: ${getValue('anticipatedProblems')}

Generated: ${new Date().toLocaleString()}
        `.trim();

        soapOutput.textContent = soapNote;
        soapOutput.classList.remove('hidden');
        outputActions.classList.remove('hidden');
        soapOutput.scrollIntoView({ behavior: 'smooth' });
    }

/**
     * Copies the generated report to the clipboard using a fallback method for local files.
     */
    function copyReport() {
        const textToCopy = soapOutput.textContent;
        const copyButton = document.getElementById('copyButton');

        // Create a temporary textarea element to hold the text
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        
        // Style it to be invisible
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.opacity = '0';

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                copyButton.textContent = 'Copied!';
            } else {
                copyButton.textContent = 'Copy Failed';
            }
        } catch (err) {
            console.error('Fallback copy failed: ', err);
            copyButton.textContent = 'Copy Failed';
        }

        document.body.removeChild(textArea);
        setTimeout(() => { copyButton.textContent = 'Copy Report 📋'; }, 2000);
    }


    // ==========================================================================
    // AUTO-SAVE & LOAD
    // ==========================================================================

    /**
     * Saves all form data, including dynamic vitals, to localStorage.
     */
    function autoSave() {
        const data = {};
        // Save static fields by ID
        document.querySelectorAll('[id]').forEach(el => {
            if (el.id && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) {
                if (el.type === 'radio') {
                    if (el.checked) data[el.name] = el.value;
                } else {
                    data[el.id] = el.value;
                }
            }
        });

        // Save dynamic vitals sets
        data.vitals = [];
        document.querySelectorAll('.vitals-set').forEach(set => {
            data.vitals.push({
                time: set.querySelector('.vitals-time')?.value || '',
                hr:   set.querySelector('.vitals-hr')?.value || '',
                rr:   set.querySelector('.vitals-rr')?.value || '',
                bp:   set.querySelector('.vitals-bp')?.value || '',
                sctm: set.querySelector('.vitals-sctm')?.value || '',
                perrl:set.querySelector('.vitals-perrl')?.value || '',
                temp: set.querySelector('.vitals-temp')?.value || '',
            });
        });

        localStorage.setItem('wildernessSoapNote', JSON.stringify(data));
    }

    /**
     * Loads all saved data from localStorage, creating vitals sets as needed.
     */
    function loadAutoSave() {
        const savedData = localStorage.getItem('wildernessSoapNote');
        if (!savedData) {
            addVitalsSet(true); // Add one empty set if no save data exists
            return;
        }

        const data = JSON.parse(savedData);

        // Load static fields
        for (const key in data) {
            if (key === 'vitals') continue;
            const element = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
            if (element) {
                if (element.type === 'radio') {
                    document.querySelector(`[name="${key}"][value="${data[key]}"]`).checked = true;
                } else {
                    element.value = data[key];
                }
            }
        }

        // Load dynamic vitals sets
        vitalsContainer.innerHTML = ''; // Clear container before loading
        if (data.vitals && data.vitals.length > 0) {
            data.vitals.forEach((vitalsData, index) => {
                const isFirst = index === 0;
                addVitalsSet(isFirst, vitalsData);
            });
        } else {
            addVitalsSet(true); // Add one empty set if saved vitals were empty
        }
    }


    // ==========================================================================
    // INITIALIZATION & EVENT LISTENERS
    // ==========================================================================

    // Main action buttons
    generateBtn.addEventListener('click', generateSOAP);
    copyButton.addEventListener('click', copyReport);
    clearButton.addEventListener('click', () => clearModal.style.display = 'block');
    addVitalsBtn.addEventListener('click', () => addVitalsSet(false));

    // Modal controls
    cancelClearBtn.addEventListener('click', () => clearModal.style.display = 'none');
    confirmClearBtn.addEventListener('click', clearForm);
    window.addEventListener('click', (event) => {
        if (event.target === clearModal) {
            clearModal.style.display = 'none';
        }
    });
    
    // Initial setup
    loadAutoSave();
    updateProgress();
    
    // Auto-save every 3 seconds and on page leave
    setInterval(autoSave, 3000);
    window.addEventListener('beforeunload', autoSave);
    
    // Add listeners to all form fields for progress updates
    document.querySelector('.content').addEventListener('input', updateProgress);
});
