document.addEventListener('DOMContentLoaded', () => {
    const requestsContainer = document.getElementById('requests-container');
    const userData = localStorage.getItem('user');
    const user = JSON.parse(userData);
    const userId = user?.id;

    if (!userId) {
        requestsContainer.innerHTML = '<p>Please log in to initiate requests.</p>';
        return;
    }

    const optionsMap = {
        "Trolley Item": ["Bed Sheets", "Pillow Cases", "Hand Towels", "Bath Towels", "Other"],
        "Bed Item": ["Mattress", "Blanket", "Pillow", "Bed Frame", "Other"],
        "Fan": ["Ceiling Fan", "Table Fan", "Wall Fan", "Exhaust Fan", "Other"],
        "Other": ["Lamp", "Chair", "Table", "Curtains", "Other"],
        "Level": ["Level 1", "Level 4", "Level 5", "Level 6", "Level 7", "Level 8", "Level 9", "Level 10"]
    };

    let currentRequestType = '';
    let isTabActive = false;

    // Render the initial HTML structure
    requestsContainer.innerHTML = `
        <div class="box" data-request="6" data-request-name="Trolley Item">Trolley Item</div>
        <div class="box" data-request="8" data-request-name="Bed Item">Bed Item</div>
        <div class="box" data-request="Fan" data-request-name="Fan">Fan</div>
        <div class="box" data-request="9" data-request-name="Garbage Collection">Garbage Collection</div>
        <div class="box" data-request="Other" data-request-name="Other">Other</div>


        <table id="requests-table" class="requests-table">
            <thead>
                <tr>
                    <th>Number</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th>Owner</th>
                    <th>Assigned Member</th>
                </tr>
            </thead>
            <tbody>
                <!-- Rows will be populated dynamically -->
            </tbody>
        </table>

        <div class="overlay" id="overlay"></div>
        <div class="popup-form" id="popup-form">
            <h2 id="popup-title">Initiate Request</h2>
            <label>Request Item:</label>
            <select id="request-item"></select>
            <label>Count:</label>
            <div class="count-container">
                <button class="count-button" id="decrease-count">-</button>
                <input type="number" id="count" value="1" min="1" />
                <button class="count-button" id="increase-count">+</button>
            </div>
            <label>Comment:</label>
            <textarea id="comment" rows="4"></textarea>
            <button id="submit-request">Initiate Request</button>
            <button id="close-requests-popup">Close</button>
        </div>
    `;

    // Event Listeners
    setupEventListeners();

    // Functions
    function setupEventListeners() {
        // Event Delegation for Box Click (Open Popup)
        requestsContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('box')) {
                currentRequestType = event.target.getAttribute('data-request');
                const requestName = event.target.getAttribute('data-request-name');
                openPopup(requestName);
            }
        });

        // Close Popup
        document.getElementById('close-requests-popup').addEventListener('click', closePopup);

        // Increase Count
        document.getElementById('increase-count').addEventListener('click', () => {
            const countInput = document.getElementById('count');
            countInput.value = parseInt(countInput.value) + 1;
        });

        // Decrease Count
        document.getElementById('decrease-count').addEventListener('click', () => {
            const countInput = document.getElementById('count');
            if (parseInt(countInput.value) > 1) {
                countInput.value = parseInt(countInput.value) - 1;
            }
        });

        // Submit Request
        document.getElementById('submit-request').addEventListener('click', submitRequest);

        // Tab Navigation
        document.querySelector('.tab[data-tab="initiate-request"]').addEventListener('click', () => {
            isTabActive = true;
            fetchTasksAndPopulateTable();
        });

        // Stop polling when the tab is inactive
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                if (tab.getAttribute('data-tab') !== 'initiate-request') {
                    isTabActive = false;
                }
            });
        });

        // Fetch Tasks on Page Load
        fetchTasksAndPopulateTable();

        // Polling for Tasks (every 5 seconds)
        setInterval(() => {
            if (isTabActive) {
                fetchTasksAndPopulateTable();
            }
        }, 5000);
    }

    function openPopup(requestName) {
        document.getElementById('popup-title').textContent = `Initiate Request for ${requestName}`;
        document.getElementById('popup-form').style.display = 'block';
        document.getElementById('overlay').style.display = 'block';
        populateOptions(requestName);
    }

    function closePopup() {
        document.getElementById('popup-form').style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
    }

    function populateOptions(requestName) {
        const requestItemSelect = document.getElementById('request-item');
        requestItemSelect.innerHTML = optionsMap[requestName]
            .map(item => `<option value="${item}">${item}</option>`)
            .join('');
    }

    function submitRequest() {
        const count = document.getElementById('count').value;
        const comment = document.getElementById('comment').value;
        const requestItem = document.getElementById('request-item').value;

        if (!requestItem || !count || !comment) {
            alert('Please fill out all fields.');
            return;
        }

        fetch('/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requestType: currentRequestType,
                count: count,
                user: userId,
                comment: comment,
                requestItem: requestItem
            })
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to submit request');
            return response.json();
        })
        .then(() => {
            alert('Request submitted successfully!');
            closePopup();
            resetForm();
            fetchTasksAndPopulateTable();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to submit request. Please try again.');
        });
    }

    function resetForm() {
        document.getElementById('request-item').selectedIndex = 0;
        document.getElementById('count').value = 1;
        document.getElementById('comment').value = '';
    }

    function fetchTasksAndPopulateTable() {
        fetch(`/requests/${userId}`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch tasks');
                return response.json();
            })
            .then(data => {
                const tableBody = document.querySelector('#requests-table tbody');
                tableBody.innerHTML = data
                    .map(task => `
                        <tr>
                            <td>${task.task_id}</td>
                            <td>${task.task_type}</td>
                            <td>${task.task_status}</td>
                            <td>${task.task_description}</td>
                            <td>${task.task_owner_name}</td>
                            <td>${task.assigned_member_name || 'Not Assigned'}</td>
                        </tr>
                    `)
                    .join('');
            })
            .catch(error => {
                console.error('Error fetching tasks:', error);
                const tableBody = document.querySelector('#requests-table tbody');
                tableBody.innerHTML = '<tr><td colspan="6">Error loading tasks.</td></tr>';
            });
    }
});