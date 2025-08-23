const API_ENDPOINT = 'http://localhost:3000/api/data';
const sheetName = 'GS Stock';

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
        
        const url = new URL(API_ENDPOINT);
        url.searchParams.append('sheet', sheetName);
        
        // Only add parameters if they have values
        if (blockNo) url.searchParams.append('blockNo', blockNo);
        if (partNo) url.searchParams.append('partNo', partNo);
        if (thickness) url.searchParams.append('thickness', thickness);
        url.searchParams.append('partial', 'true'); // Enable partial matching

        const response = await fetch(url);
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
function displayData(data) {
    const table = document.getElementById('dataTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    // Clear existing data
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (data.length === 0) {
        showToast('No matching records found');
        return;
    }

    // Create table headers
    const headerRow = document.createElement('tr');
    Object.keys(data[0]).forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Add data rows
    data.forEach(row => {
        const tr = document.createElement('tr');
        Object.values(row).forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
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