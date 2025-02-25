document.addEventListener('DOMContentLoaded', () => {
    const roomContainer = document.getElementById('main-container');
    const popupOverlay = document.getElementById('popup-overlay');
    const closePopupButton = document.getElementById('close-popup-main');

    // Function to show the popup
    function showPopup() {
        popupOverlay.style.display = 'flex'; // Show the popup overlay
    }

    // Function to hide the popup
    function hidePopup() {
        popupOverlay.style.display = 'none'; // Hide the popup overlay
    }

    // Close popup when the close button is clicked
    closePopupButton.addEventListener('click', hidePopup);

    // Close popup when clicking outside the popup container
    popupOverlay.addEventListener('click', (event) => {
        if (event.target === popupOverlay) {
            hidePopup();
        }
    });

    async function fetchRooms() {
        const response = await fetch('/rooms');
        const rooms = await response.json();
        renderRooms(rooms);
    }

    function renderRooms(rooms) {
        roomContainer.innerHTML = ''; // Clear the container

        // Create a legend container
        const legendContainer = document.createElement('div');
        legendContainer.classList.add('legend-container');

        // Get all unique statuses from the rooms
        const statuses = [...new Set(rooms.map(room => room.status))];

        // Create legend items for each status
        statuses.forEach(status => {
            const legendItem = document.createElement('div');
            legendItem.classList.add('legend-item');

            // Create a color box for the status
            const colorBox = document.createElement('div');
            colorBox.classList.add('color-box', status);
            legendItem.appendChild(colorBox);

            // Add the status text
            const statusText = document.createElement('span');
            statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1); // Capitalize first letter
            legendItem.appendChild(statusText);

            // Append the legend item to the legend container
            legendContainer.appendChild(legendItem);
        });

        // Append the legend to the room container
        roomContainer.appendChild(legendContainer);

        // Group rooms by their level
        const floors = {};
        rooms.forEach(room => {
            if (!floors[room.level]) {
                floors[room.level] = [];
            }
            floors[room.level].push(room);
        });

        // Sort levels in descending order (Level 1 will appear last)
        Object.keys(floors)
            .sort((a, b) => b - a) // Sort levels in descending order
            .forEach(level => {
                const levelContainer = document.createElement('div');
                levelContainer.classList.add('main-level-container');

                // Add level title
                const levelTitle = document.createElement('div');
                levelTitle.classList.add('main-level-title');
                levelTitle.textContent = `Level ${level}`;
                levelContainer.appendChild(levelTitle);

                // Create a container for the floor
                const floorDiv = document.createElement('div');
                floorDiv.classList.add('floor');

                // Organize rooms into rows (10 rooms per row)
                const rows = [];
                let currentRow = document.createElement('div');
                currentRow.classList.add('row');
                rows.push(currentRow);

                // Sort rooms by room number and add them to rows
                floors[level]
                    .sort((a, b) => a.room_number - b.room_number)
                    .forEach((room, index) => {
                        const roomDiv = document.createElement('div');
                        roomDiv.classList.add('room', room.status);
                        roomDiv.textContent = room.room_number;

                        // Add click event listener to each room card
                        roomDiv.addEventListener('click', () => fetchRoomDetails(room.room_id));

                        // Start a new row after every 10 rooms
                        if (index % 10 === 0 && index !== 0) {
                            currentRow = document.createElement('div');
                            currentRow.classList.add('row');
                            rows.push(currentRow);
                        }
                        currentRow.appendChild(roomDiv);
                    });

                // Append rows to the floor container
                rows.forEach(row => floorDiv.appendChild(row));
                levelContainer.appendChild(floorDiv);
                roomContainer.appendChild(levelContainer);
            });
    }

    async function fetchRoomDetails(roomId) {
        const response = await fetch(`/room-details/${roomId}`);
        const data = await response.json();
        renderRoomDetails(data);
        showPopup(); // Show the popup after fetching details
    }

    function renderRoomDetails(data) {
        const roomDetailsContainer = document.querySelector('.room-details');
        roomDetailsContainer.innerHTML = ''; // Clear previous details
    
        // Add room details
        const roomDetails = data.roomDetails;
        const roomCleaningDetails = data.roomCleaningDetails;
        const tasks = data.tasks;
    
        const roomInfo = document.createElement('div');
        roomInfo.innerHTML = `
            <h2>Room ${roomDetails.room_number}</h2>
            <p>Status: ${roomDetails.status}</p>
            <p>Type: ${roomDetails.type}</p>
            <p>Level: ${roomDetails.level}</p>
            <p>Visitor Status: ${roomDetails.visitor_status}</p>
        `;
        roomDetailsContainer.appendChild(roomInfo);
    
        const cleaningInfo = document.createElement('div');
        cleaningInfo.innerHTML = `
            <h3>Cleaning Details</h3>
            <p>Planned Cleaning Date: ${new Date(roomCleaningDetails.cleaning_date).toISOString().split('T')[0] || 'N/A'}</p>
            <p>Cleaning Type: ${roomCleaningDetails.cleaning_type || 'N/A'}</p>
            <p>Current Room Status: ${roomCleaningDetails.current_room_status_name || 'N/A'}</p>
        `;
        roomDetailsContainer.appendChild(cleaningInfo);
    
        const tasksInfo = document.createElement('div');
        tasksInfo.innerHTML = `
            <h3>Tasks</h3>
            <ul>
                ${tasks.map(task => `
                    <li class="task-status-${task.task_status_id}">
                        <p>Task ID: ${task.task_id}</p>
                        <p>Task Type: ${task.task_type}</p>
                        <p>Task Status: ${getTaskStatusText(task.task_status_id)}</p>
                        <p>Assigned Members: ${task.assigned_members.map(member => member.member_name).join(', ')}</p>
                    </li>
                `).join('')}
            </ul>
        `;
        roomDetailsContainer.appendChild(tasksInfo);
    }
    
    // Helper function to get task status text
    function getTaskStatusText(taskStatusId) {
        const statusMap = {
            1: 'Initiated',
            2: 'Assigned',
            3: 'Started',
            4: 'On Hold',
            5: 'Completed',
            6: 'Discarded',
            7: 'Unassigned',
        };
        return statusMap[taskStatusId] || 'Unknown';
    }

    fetchRooms();
    setInterval(fetchRooms, 5000); // Refresh every 5 seconds
});