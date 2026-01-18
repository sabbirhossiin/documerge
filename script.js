// --- SECURITY CONFIGURATION ---
const SECRET_PASS = "5544332211";
const STORAGE_KEY = "documerge_access_token";

// --- 0. Authentication Logic ---
function initSecurity() {
    const token = localStorage.getItem(STORAGE_KEY);
    // Simple verification (in a real app, use hashes, but this works for personal use)
    if (token === btoa(SECRET_PASS)) {
        unlockApp();
    }
}

function checkLogin() {
    const input = document.getElementById('pass-input');
    const errorMsg = document.getElementById('login-error');
    
    if (input.value === SECRET_PASS) {
        // Success
        localStorage.setItem(STORAGE_KEY, btoa(SECRET_PASS)); // Store encoded
        unlockApp();
    } else {
        // Fail
        errorMsg.classList.remove('hidden');
        input.classList.add('border-red-500');
        input.classList.add('animate-pulse');
        setTimeout(() => input.classList.remove('animate-pulse'), 500);
    }
}

function unlockApp() {
    const overlay = document.getElementById('login-overlay');
    const app = document.getElementById('app-container');
    
    // Hide overlay with fade out
    overlay.style.transition = 'opacity 0.5s';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 500); // Remove from DOM
    
    // Show App
    app.classList.remove('blur-sm');
    app.classList.remove('opacity-0');
    
    addLog("User authenticated. System unlocked.");
    lucide.createIcons();
}

// Add enter key support for login
document.getElementById('pass-input')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        checkLogin();
    }
});

// Run security check on load
initSecurity();


// --- APP LOGIC BELOW (Smart Grouping & Processing) ---

// Global State
const fileStore = {
    iqma: [],
    ajeer: [],
    insurance: [],
    medical: []
};
let matchedData = {};

// Initialize Lucide Icons (Initial call)
lucide.createIcons();

// --- 1. File Handling ---
const categories = ['iqma', 'ajeer', 'insurance', 'medical'];

categories.forEach(cat => {
    const input = document.getElementById(`input-${cat}`);
    const countLabel = document.getElementById(`count-${cat}`);
    
    input.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        // Filter out hidden files
        fileStore[cat] = files.filter(f => !f.name.startsWith('.'));
        
        countLabel.textContent = `${fileStore[cat].length} files loaded`;
        countLabel.classList.add('text-green-400');
        addLog(`Loaded ${fileStore[cat].length} files into ${cat} folder.`);
        
        // Visual feedback
        document.getElementById(`drop-${cat}`).classList.add('border-accent');
    });
});

// --- Profile Image Logic ---
const pfpInput = document.getElementById('pfp-upload');
const profileImg = document.getElementById('profile-img');

pfpInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => profileImg.src = ev.target.result;
        reader.readAsDataURL(file);
    }
});

// --- 2. Smart Matching Logic ---
document.getElementById('btn-match').addEventListener('click', () => {
    addLog("Starting smart matching process...");
    matchedData = {};

    // Helper: Cleans filename to find the REAL person name
    const getCleanName = (filename) => {
        // 1. Remove Extension
        let name = filename.substring(0, filename.lastIndexOf('.')) || filename;
        
        // 2. Remove common category suffixes (Case Insensitive)
        const keywords = ['iqma', 'ajeer', 'insurance', 'medical', 'copy', 'scan', 'final'];
        keywords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi'); 
            name = name.replace(regex, ''); 
        });

        // 3. Remove extra spaces and special chars
        name = name.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
        return name.toLowerCase();
    };

    // Helper: Get Display Name
    const formatDisplayName = (cleanName) => {
        return cleanName.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Scan all folders
    categories.forEach(cat => {
        fileStore[cat].forEach(file => {
            const cleanKey = getCleanName(file.name);
            
            // If person doesn't exist, init object
            if (!matchedData[cleanKey]) {
                matchedData[cleanKey] = {
                    key: cleanKey,
                    name: formatDisplayName(cleanKey), 
                    iqma: [],
                    ajeer: [],
                    insurance: [],
                    medical: []
                };
            }
            // Push file to specific category
            matchedData[cleanKey][cat].push(file);
        });
    });

    renderTable();
    
    const count = Object.keys(matchedData).length;
    document.getElementById('total-persons').textContent = count;
    document.getElementById('results-section').classList.remove('hidden');
    addLog(`Matching complete. Found ${count} unique persons.`);
    showToast('Analysis Complete', `Found ${count} unique persons. Groups merged.`, 'success');
});

// --- 3. UI Rendering ---
function renderTable() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    const searchTerm = document.getElementById('search-box').value.toLowerCase();

    Object.values(matchedData).forEach(person => {
        if (searchTerm && !person.name.toLowerCase().includes(searchTerm)) return;

        const isComplete = person.iqma.length > 0 && person.ajeer.length > 0 && person.insurance.length > 0 && person.medical.length > 0;
        
        const row = `
            <tr class="bg-gray-800/50 border-b border-gray-700 group hover:bg-gray-800 transition-colors">
                <td class="px-6 py-4 font-medium text-white flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full ${isComplete ? 'bg-green-600' : 'bg-gray-600'} flex items-center justify-center text-xs font-bold shadow-lg">
                        ${person.name.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                        <div class="text-sm font-bold text-gray-200">${person.name}</div>
                        <div class="text-[10px] text-gray-500 uppercase tracking-wide">${isComplete ? 'Complete' : 'Incomplete'}</div>
                    </div>
                </td>
                <td class="px-6 py-4 text-center border-l border-gray-700/50">
                    ${getBadge(person.iqma.length, 'iqma')}
                </td>
                <td class="px-6 py-4 text-center border-l border-gray-700/50">
                    ${getBadge(person.ajeer.length, 'ajeer')}
                </td>
                <td class="px-6 py-4 text-center border-l border-gray-700/50">
                    ${getBadge(person.insurance.length, 'insurance')}
                </td>
                <td class="px-6 py-4 text-center border-l border-gray-700/50">
                    ${getBadge(person.medical.length, 'medical')}
                </td>
                <td class="px-6 py-4 text-center border-l border-gray-700">
                    <div class="flex items-center justify-center gap-3">
                        <button onclick="previewIndividual('${person.key}')" 
                                class="p-2 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all" 
                                title="Preview Merged PDF">
                            <i data-lucide="eye" class="w-5 h-5"></i>
                        </button>
                        <button onclick="downloadIndividual('${person.key}')" 
                                class="p-2 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-all"
                                title="Download PDF">
                            <i data-lucide="download" class="w-5 h-5"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
    
    lucide.createIcons();
}

function getBadge(count, type) {
    if (count > 0) {
        return `
            <div class="flex flex-col items-center">
                 <i data-lucide="check-circle-2" class="w-5 h-5 text-green-500 mb-1"></i>
                 <span class="text-xs text-gray-400 font-mono">${count} file(s)</span>
            </div>
        `;
    }
    return `
        <div class="flex flex-col items-center opacity-40">
            <i data-lucide="x-circle" class="w-5 h-5 text-red-500 mb-1"></i>
            <span class="text-[10px] text-red-400 uppercase">Missing</span>
        </div>
    `;
}

document.getElementById('search-box').addEventListener('input', renderTable);

// --- 4. PDF Logic ---
async function generatePDFForPerson(personKey) {
    const person = matchedData[personKey];
    if (!person) return null;

    const mergedPdf = await PDFLib.PDFDocument.create();
    const allFiles = [...person.iqma, ...person.ajeer, ...person.insurance, ...person.medical];

    if (allFiles.length === 0) {
        showToast('Error', 'No files to generate PDF', 'error');
        return null;
    }

    const useWatermark = document.getElementById('check-watermark').checked;

    for (const file of allFiles) {
        const arrayBuffer = await file.arrayBuffer();
        try {
            if (file.type === 'application/pdf') {
                const srcDoc = await PDFLib.PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
                copiedPages.forEach(page => mergedPdf.addPage(page));
            } else if (file.type.startsWith('image/')) {
                let img;
                if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                    img = await mergedPdf.embedJpg(arrayBuffer);
                } else {
                    img = await mergedPdf.embedPng(arrayBuffer);
                }
                const page = mergedPdf.addPage([img.width, img.height]);
                page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
            }
        } catch (e) {
            console.error(e);
            addLog(`Error processing file for ${person.name}: ${e.message}`);
        }
    }

    if (useWatermark) {
        const pages = mergedPdf.getPages();
        const font = await mergedPdf.embedFont(PDFLib.StandardFonts.HelveticaBold);
        pages.forEach(page => {
            const { width, height } = page.getSize();
            page.drawText('CONFIDENTIAL', {
                x: 50, y: 50, size: 40, font: font,
                color: PDFLib.rgb(0.95, 0.1, 0.1), opacity: 0.3,
                rotate: PDFLib.degrees(45),
            });
        });
    }

    return await mergedPdf.save();
}

window.previewIndividual = async (key) => {
    addLog(`Generating preview for: ${matchedData[key].name}...`);
    showToast('Generating Preview', 'Please wait...', 'success');
    
    const pdfBytes = await generatePDFForPerson(key);
    if(pdfBytes) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        addLog(`Preview opened for ${matchedData[key].name}`);
    }
};

window.downloadIndividual = async (key) => {
    const person = matchedData[key];
    addLog(`Starting download for: ${person.name}...`);
    
    const pdfBytes = await generatePDFForPerson(key);
    if(pdfBytes) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const renameWithYear = document.getElementById('check-rename').checked;
        let filename = person.name;
        if (renameWithYear) filename += `_${new Date().getFullYear()}`;
        filename += '.pdf';
        
        saveAs(blob, filename);
        showToast('Download Started', `${filename} saved.`, 'success');
        addLog(`Downloaded ${filename}`);
    }
};

document.getElementById('btn-process').addEventListener('click', async () => {
    const btn = document.getElementById('btn-process');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressContainer = document.getElementById('progress-container');
    
    btn.disabled = true;
    progressContainer.classList.remove('hidden');
    
    const zip = new JSZip();
    const persons = Object.values(matchedData);
    const total = persons.length;
    let processed = 0;
    const renameWithYear = document.getElementById('check-rename').checked;
    const year = new Date().getFullYear();

    addLog(`Starting ZIP generation for ${total} profiles...`);

    for (const person of persons) {
        const pdfBytes = await generatePDFForPerson(person.key);
        if(pdfBytes) {
            let finalName = person.name;
            if (renameWithYear) finalName += `_${year}`;
            finalName += '.pdf';
            zip.file(finalName, pdfBytes);
        }
        
        processed++;
        const pct = Math.round((processed / total) * 100);
        progressBar.style.width = `${pct}%`;
        progressText.textContent = `${pct}%`;
    }

    addLog("Compressing ZIP file...");
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `DocuMerge_All_${new Date().toISOString().slice(0,10)}.zip`);

    btn.disabled = false;
    progressContainer.classList.add('hidden');
    showToast('Success!', 'ZIP file downloaded.', 'success');
});

// Utilities
function addLog(msg) {
    const logPanel = document.getElementById('system-logs');
    if (!logPanel) return;
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.textContent = `[${time}] ${msg}`;
    logPanel.appendChild(entry);
    logPanel.scrollTop = logPanel.scrollHeight;
}

function showToast(title, msg, type) {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');
    const tTitle = document.getElementById('toast-title');
    const tMsg = document.getElementById('toast-msg');

    tTitle.textContent = title;
    tMsg.textContent = msg;
    
    if(type === 'success') {
        icon.innerHTML = '<i data-lucide="check-circle" class="text-green-600"></i>';
        toast.className = 'fixed bottom-5 right-5 bg-white border-l-4 border-green-500 text-gray-900 px-6 py-4 rounded-lg shadow-2xl transform transition-transform duration-300 z-[200] flex items-center gap-3 translate-y-0';
    } else {
        icon.innerHTML = '<i data-lucide="alert-circle" class="text-red-600"></i>';
    }
    
    lucide.createIcons();
    setTimeout(() => {
        toast.classList.add('translate-y-20');
    }, 4000);
}
