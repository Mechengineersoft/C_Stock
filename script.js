// API endpoint configuration
const API_ENDPOINT = window.location.hostname === 'localhost' ? 'http://localhost:3000/api/data' : '/.netlify/functions/fetchData';
const sheetName = 'CutterData'; // Default sheet name for main page

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add input event listeners for auto-search
function setupAutoSearch() {
    const inputs = ['blockNo', 'partNo', 'thickness'];
    const debouncedSearch = debounce(searchData, 500);
    
    inputs.forEach(id => {
        const input = document.getElementById(id);
        input.addEventListener('input', debouncedSearch);
    });
}

// Initial loader handling
// Create toast element
const toastContainer = document.createElement('div');
toastContainer.style.cssText = 'position: fixed; top: 150px; left: 20px; background: #4CAF50; color: white; padding: 16px; border-radius: 4px; z-index: 1000; opacity: 0; transition: opacity 0.3s ease-in-out;';
document.body.appendChild(toastContainer);

// Show toast message function
function showToast(message, duration = 2000) {
    toastContainer.textContent = message;
    toastContainer.style.opacity = '1';
    setTimeout(() => {
        toastContainer.style.opacity = '0';
    }, duration);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const loaderElement = document.querySelector('.app-loader');
        const response = await fetch(`${API_ENDPOINT}?blockNo=test`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (Array.isArray(data)) {
            showToast('Welcome to Rashi Granite Block Search');
            loaderElement.classList.add('hidden');
            setupAutoSearch(); // Initialize auto-search functionality
        } else {
            throw new Error('Invalid data format received');
        }
    } catch (error) {
        console.error('Connection error:', error);
        alert('Unable to connect to the server. Please check your internet connection and try again.');
        // Wait a bit before reloading to prevent rapid reload loops
        setTimeout(() => location.reload(), 2000);
    }
});

// Search Data function
async function searchData() {
    const blockNo = document.getElementById('blockNo').value;
    
    if (!blockNo) {
        alert('Block No is required');
        return;
    }

    const loaderOverlay = document.querySelector('.loader-overlay');
    loaderOverlay.classList.add('active');
    
    const partNo = document.getElementById('partNo').value;
    const thickness = document.getElementById('thickness').value;

    try {
        const url = new URL(API_ENDPOINT, window.location.origin);
        url.searchParams.append('sheet', sheetName);
        if (blockNo) url.searchParams.append('blockNo', blockNo);
        if (partNo) url.searchParams.append('partNo', partNo);
        if (thickness) url.searchParams.append('thickness', thickness);

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('API Response:', data);
        displayData(data);
    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        loaderOverlay.classList.remove('active');
    }
}

// Display Data function
function displayData(data) {
    const tableHead = document.querySelector('#dataTable thead');
    const tableBody = document.querySelector('#dataTable tbody');
    const colorDisplay = document.getElementById('colorDisplay');
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    if (data.length > 0) {
        const colour1 = data[0][21]; // Column V (index 21)
        const colour2 = data[0][22]; // Column W (index 22)
        colorDisplay.innerHTML = `Fac Colour: ${colour1} <br> Sub Colour: ${colour2}`;
        colorDisplay.style.color = colour1;
        colorDisplay.style.backgroundColor = colour2;

        // Define headers and check which columns have data
        const headers = ['Block No', 'Part', 'Thk cm', 'Nos', 'Grind', 'Net', 'Epoxy', 'Polish', 
                        'Leather', 'Lapotra', 'Honed', 'Shot', 'Pol R', 'Bal', 'B SP', 'Edge', 
                        'Meas', 'L cm', 'H cm', 'Status', 'Date'];
        const nonEmptyColumns = [];

        // Check each column for non-empty values
        for(let i = 0; i <= 20; i++) {
            const hasData = data.some(row => row[i] && row[i].toString().trim() !== '');
            if (hasData) {
                nonEmptyColumns.push(i);
            }
        }

        // Create table headers only for non-empty columns
        const headerRow = document.createElement('tr');
        nonEmptyColumns.forEach(colIndex => {
            const th = document.createElement('th');
            th.textContent = headers[colIndex];
            headerRow.appendChild(th);
        });
        tableHead.appendChild(headerRow);

        // Create table body with only non-empty columns
        data.forEach(row => {
            const tr = document.createElement('tr');
            nonEmptyColumns.forEach(colIndex => {
                const td = document.createElement('td');
                td.textContent = row[colIndex] || '';
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    } else {
        colorDisplay.innerHTML = 'No data found';
        colorDisplay.style.color = 'black';
        colorDisplay.style.backgroundColor = 'transparent';
    }
}

// Clear Data function
function clearData() {
    document.getElementById('blockNo').value = '';
    document.getElementById('partNo').value = '';
    document.getElementById('thickness').value = '';
    document.getElementById('colorDisplay').innerHTML = '';
    document.querySelector('#dataTable tbody').innerHTML = '';
}



// Voice Input functionality
function startVoiceInput(inputId) {
    if (!('webkitSpeechRecognition' in window)) {
        alert('Voice input is not supported in your browser. Please use Chrome.');
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    const micButton = document.querySelector(`#${inputId}`).nextElementSibling;
    micButton.style.color = '#ff4444';

    recognition.onstart = () => {
        micButton.style.color = '#ff4444';
    };

    recognition.onend = () => {
        micButton.style.color = 'currentColor';
    };

    recognition.onresult = (event) => {
        let transcript = event.results[0][0].transcript;
        
        // Process the transcript to remove spaces between single characters
        // This handles cases like "a b c" becoming "abc"
        if (/^[a-z0-9](\s+[a-z0-9])+$/i.test(transcript.trim())) {
            transcript = transcript.replace(/\s+/g, '');
        }
        
        // Handle single letter or digit (they often come with spaces)
        if (transcript.trim().length === 1) {
            transcript = transcript.trim();
        }
        
        document.getElementById(inputId).value = transcript;
        // Trigger search after voice input is complete
        searchData();
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        micButton.style.color = 'currentColor';
    };

    recognition.start();
}

document.addEventListener('DOMContentLoaded', () => {
    // Add input event listeners to search fields
    const searchFields = ['blockNo', 'partNo', 'thickness'];
    searchFields.forEach(fieldId => {
        document.getElementById(fieldId).addEventListener('input', debounce(() => {
            if (document.getElementById('blockNo').value) {
                searchData();
            }
        }, 300));
    });
});

// Debounce function to prevent too many API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}