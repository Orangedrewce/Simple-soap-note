
// DOM Elements
const clearModal = document.getElementById('clearModal');
const confirmClearBtn = document.getElementById('confirmClearBtn');
const cancelClearBtn = document.getElementById('cancelClearBtn');
const generateBtn = document.getElementById('generateBtn');

// Progress tracking
function updateProgress() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="radio"]:checked, textarea, select');
    const totalFields = document.querySelectorAll('input[type="text"]:not([readonly]), textarea, select').length + (document.querySelectorAll('input[name="vitalsStatus"]').length > 0 ? 1 : 0);
    
    let filled = 0;
    document.querySelectorAll('input[type="text"]:not([readonly]), textarea, select').forEach(input => {
        if (input.value.trim() !== '') filled++;
    });

    if (document.querySelector('input[name="vitalsStatus"]:checked')) {
        filled++;
    }

    const progress = totalFields > 0 ? (filled / totalFields) * 100 : 0;
    document.getElementById('progressFill').style.width = progress + '%';
}

// Add event listeners when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', updateProgress);
        input.addEventListener('change', updateProgress);
    });
    
    generateBtn.addEventListener('click', generateSOAP);
    document.getElementById('copyButton').addEventListener('click', copyReport);
    document.getElementById('clearButton').addEventListener('click', () => {
        clearModal.style.display = 'block';
    });
    
    // Modal listeners
    cancelClearBtn.addEventListener('click', () => clearModal.style.display = 'none');
    confirmClearBtn.addEventListener('click', clearForm);
    window.addEventListener('click', (event) => {
        if (event.target == clearModal) {
            clearModal.style.display = 'none';
        }
    });

    // Vitals Set Listeners
    document.getElementById('addVitalsBtn').addEventListener('click', addVitalsSet);
    
    // Add initial vitals set and load saved data
    addVitalsSet();
    loadAutoSave();
    updateProgress();
});

// Sets the current time in a vitals set time field
function setCurrentTime(button) {
    const timeInput = button.parentElement.querySelector('.vitals-time');
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // The hour '0' should be '12'
    const strTime = `${hours}:${minutes} ${ampm}`;
    timeInput.value = strTime;
    timeInput.dispatchEvent(new Event('input', { bubbles: true })); // Trigger progress update
}

function addVitalsSet() {
    const container = document.getElementById('vitals-sets-container');
    const newSet = document.createElement('div');
    newSet.className = 'vitals-set';

    // The innerHTML is updated with validation attributes
    newSet.innerHTML = `
        <button class="remove-vitals-btn" onclick="this.parentElement.remove(); updateProgress();">×</button>
        <div class="vitals-grid">
            <div class="vital-item time-item">
                <label>Time:</label>
                <input type="text" class="vitals-time" placeholder="8:30 AM" pattern="\\d{1,2}:\\d{2}\\s[APap][Mm]">
                <button type="button" class="set-time-btn">Now</button>
            </div>
            <div class="vital-item">
                <label>Heart Rate:</label>
                <input type="number" class="vitals-hr" placeholder="e.g., 80" min="0" max="300">
            </div>
            <div class="vital-item">
                <label>Resp Rate:</label>
                <input type="number" class="vitals-rr" placeholder="e.g., 16" min="0" max="60">
            </div>
            <div class="vital-item">
                <label>Blood Pressure:</label>
                <input type="text" class="vitals-bp" placeholder="e.g., 120/80" pattern="\\d{1,3}/\\d{1,3}">
            </div>
            <div class="vital-item">
                <label>SCTM:</label>
                <input type="text" class="vitals-sctm" placeholder="e.g., Pink, warm, dry">
            </div>
            <div class="vital-item">
                <label>PERRL:</label>
                <input type="text" class="vitals-perrl" placeholder="e.g., 3mm reactive">
            </div>
            <div class="vital-item">
                <label>Temperature:</label>
                 <input type="text" class="vitals-temp" placeholder="e.g., 98.6 or Normal">
            </div>
        </div>
    `;
    container.appendChild(newSet);

    // Add event listener to the new "Now" button
    newSet.querySelector('.set-time-btn').addEventListener('click', function() {
        setCurrentTime(this);
    });
    
    // Add event listeners for progress tracking to new inputs
    newSet.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', updateProgress);
    });
}

function generateSOAP() {
    const vitalsStatus = document.querySelector('input[name="vitalsStatus"]:checked')?.value || '[Not documented]';
    let vitalsDetails = '';
    const vitalsSets = document.querySelectorAll('.vitals-set');

    if (vitalsSets.length > 0) {
        vitalsSets.forEach((set, index) => {
            const time = set.querySelector('.vitals-time').value || '[No time]';
            const hr = set.querySelector('.vitals-hr').value || '[N/A]';
            const rr = set.querySelector('.vitals-rr').value || '[N/A]';
            const bp = set.querySelector('.vitals-bp').value || '[N/A]';
            const sctm = set.querySelector('.vitals-sctm').value || '[N/A]';
            const perrl = set.querySelector('.vitals-perrl').value || '[N/A]';
            const temp = set.querySelector('.vitals-temp').value || '[N/A]';

            vitalsDetails += `
  Set ${index + 1} at ${time}:
  • HR: ${hr} | RR: ${rr} | BP: ${bp}
  • SCTM: ${sctm} | PERRL: ${perrl} | Temp: ${temp}`;
        });
    } else {
        vitalsDetails = '\n  [No vitals recorded]';
    }

    const soapNote = `
WILDERNESS SOAP NOTE
====================

SUBJECTIVE:
-----------
Rescuer: ${document.getElementById('rescuerName').value || '[Not provided]'}
Patient: ${document.getElementById('patientInfo').value || '[Not provided]'}

OPQRST Assessment:
• Onset: ${document.getElementById('onset').value || '[Not documented]'}
• Provocation/Palliation: ${document.getElementById('provocation').value || '[Not documented]'}
• Quality: ${document.getElementById('quality').value || '[Not documented]'}
• Radiation/Region: ${document.getElementById('radiation').value || '[Not documented]'}
• Severity: ${document.getElementById('severity').value || '[Not documented]'}
• Time: ${document.getElementById('time').value || '[Not documented]'}

Mechanism of Injury/HPI: ${document.getElementById('moiHpi').value || '[Not documented]'}
Current Level of Responsiveness: ${document.getElementById('lor').value || '[Not documented]'}

OBJECTIVE:
----------
Head-to-Toe Findings: ${document.getElementById('headToToe').value || '[Not documented]'}
Position Found: ${document.getElementById('foundPosition').value || '[Not documented]'}
Pertinent Negatives: ${document.getElementById('pertinentNegatives').value || '[Not documented]'}

Vital Signs Details:${vitalsDetails}

Overall Vitals Trend: ${vitalsStatus}

SAMPLE History:
• Signs/Symptoms: ${document.getElementById('symptoms').value || '[Not documented]'}
• Allergies: ${document.getElementById('allergies').value || '[Not documented]'}
• Medications: ${document.getElementById('medications').value || '[Not documented]'}
• Pertinent History: ${document.getElementById('pertinentHistory').value || '[Not documented]'}
• Last Ins/Outs: ${document.getElementById('lastInsOuts').value || '[Not documented]'}
• Events: ${document.getElementById('events').value || '[Not documented]'}

ASSESSMENT:
-----------
Problem List: ${document.getElementById('problemList').value || '[Not documented]'}
Spine Injury Assessment: ${document.getElementById('spineAssessment').value || '[Not documented]'}

PLAN:
-----
Treatment Plan: ${document.getElementById('treatments').value || '[Not documented]'}
Evacuation Plan: ${document.getElementById('evacuation').value || '[Not documented]'}
Support Requested: ${document.getElementById('support').value || '[Not documented]'}
Anticipated Problems: ${document.getElementById('anticipatedProblems').value || '[Not documented]'}

Generated: ${new Date().toLocaleString()}
    `;

    const outputDiv = document.getElementById('soapOutput');
    outputDiv.textContent = soapNote.trim();
    outputDiv.classList.remove('hidden');
    document.getElementById('outputActions').classList.remove('hidden');
    outputDiv.scrollIntoView({ behavior: 'smooth' });
}

function copyReport() {
    const textToCopy = document.getElementById('soapOutput').textContent;
    const copyButton = document.getElementById('copyButton');
    
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        copyButton.textContent = 'Copied!';
        setTimeout(() => { copyButton.textContent = 'Copy Report 📋'; }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        copyButton.textContent = 'Copy Failed';
         setTimeout(() => { copyButton.textContent = 'Copy Report 📋'; }, 2000);
    }
    document.body.removeChild(textArea);
}

function clearForm() {
    // Clear all static form fields
    document.querySelectorAll('input[type="text"], textarea, select').forEach(input => {
        input.value = '';
    });
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.checked = false;
    });

    // Clear dynamic vitals and add one fresh set back
    document.getElementById('vitals-sets-container').innerHTML = '';
    addVitalsSet();

    // Hide the output section and modal
    document.getElementById('soapOutput').classList.add('hidden');
    document.getElementById('outputActions').classList.add('hidden');
    clearModal.style.display = 'none';

    // Clear saved data from localStorage
    localStorage.removeItem('wildernessSoapNote');

    // Update the progress bar to 0 and scroll to top
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Auto-save functionality (NOTE: Does not save dynamic vitals)
function autoSave() {
    const data = {};
    document.querySelectorAll('input[type="text"], textarea, select').forEach(input => {
        if (input.id) { // Only save elements with an ID
            data[input.id] = input.value;
        }
    });
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        if(radio.checked) {
            data[radio.name] = radio.value;
        }
    });
    localStorage.setItem('wildernessSoapNote', JSON.stringify(data));
}

function loadAutoSave() {
    const savedData = localStorage.getItem('wildernessSoapNote');
    if (savedData) {
        const data = JSON.parse(savedData);
        for (const key in data) {
            const element = document.getElementById(key);
            if (element) {
                element.value = data[key];
            } else if (document.querySelector(`input[name="${key}"][value="${data[key]}"]`)) {
                document.querySelector(`input[name="${key}"][value="${data[key]}"]`).checked = true;
            }
        }
    }
}

// Auto-save every 5 seconds
setInterval(autoSave, 5000);
