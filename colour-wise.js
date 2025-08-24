const API_ENDPOINT = window.location.hostname === 'localhost' ? 'http://localhost:3000/api/data' : '/.netlify/functions/fetchData';
const sheetName = 'Copy of GS Stock';

// Toast message handling
function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : 'success'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Load initial data when the page loads
document.addEventListener('DOMContentLoaded', () => {
    setupAutoSearch();
    searchData();
});

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

// Setup auto-search functionality
function setupAutoSearch() {
    const debouncedSearch = debounce(() => searchData(), 300);
    ['blockNo', 'partNo', 'thickness'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', debouncedSearch);
        }
    });
}

// Function to search data
async function searchData() {
    const blockNo = document.getElementById('blockNo').value;
    const partNo = document.getElementById('partNo').value;
    const thickness = document.getElementById('thickness').value;

    try {
        document.querySelector('.loader-overlay').style.display = 'flex';
        
        const url = new URL(API_ENDPOINT, window.location.origin);
        url.searchParams.append('sheet', sheetName);
        
        // Only add parameters if they have values
        if (blockNo) url.searchParams.append('blockNo', blockNo);
        if (partNo) url.searchParams.append('partNo', partNo);
        if (thickness) url.searchParams.append('thickness', thickness);
        url.searchParams.append('partial', 'true'); // Enable partial matching

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });
        const data = await response.json();

        if (response.ok) {
            displayData(data);
        } else {
            showToast(data.error || 'Error fetching data', true);
        }
    } catch (error) {
        showToast('Error connecting to server', true);
        console.error('Error:', error);
    } finally {
        document.querySelector('.loader-overlay').style.display = 'none';
    }
}

// Function to display data in the table
// Display Data function
function displayData(data) {
    const tableHead = document.querySelector('#dataTable thead');
    const tableBody = document.querySelector('#dataTable tbody');
    const colorDisplay = document.getElementById('colorDisplay');
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    if (data.length > 0) {
        // Assuming `data` is a 2D array from Google Sheets or similar
// Example: data[row][col]

// Sum of column D (index 3)
const totalNos = data.reduce((sum, row) => sum + (parseFloat(row[3]) || 0), 0);

// Unique values in column C (index 2)
const totalThkSet = new Set(data.map(row => row[2]));
const totalThk = Array.from(totalThkSet).join(", ");

// Display
colorDisplay.innerHTML = `Total Nos: ${totalNos} <br> Total Thk: ${totalThk}`;
colorDisplay.style.color = "#580F41";
colorDisplay.style.backgroundColor = "#E6E0F8";


        // Define headers and check which columns have data
        const headers = ['Fac Colour','Sub Colour', 'Thk cm', 'Nos','Block No', 'Part', 'L cm', 'H cm', 'Date', 'Grind', 'Net', 'Epoxy', 'Polish', 
                        'Leather', 'Lapotra', 'Honed', 'Shot', 'Pol R', 'Bal', 'B SP', 'Edge', 
                        'Meas', 'Status'];
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

// Function to clear search inputs and results
function clearData() {
    document.getElementById('blockNo').value = '';
    document.getElementById('partNo').value = '';
    document.getElementById('thickness').value = '';
    searchData();
}

// Voice input functionality
function startVoiceInput(inputId) {
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const input = document.getElementById(inputId);
            input.value = event.results[0][0].transcript;
            input.dispatchEvent(new Event('input'));
        };

        recognition.onerror = (event) => {
            showToast('Error in voice recognition: ' + event.error, true);
        };

        recognition.start();
    } else {
        showToast('Voice recognition is not supported in this browser', true);
    }
}

// Hide app loader when the page is fully loaded
window.addEventListener('load', () => {
    document.querySelector('.app-loader').style.display = 'none';
});