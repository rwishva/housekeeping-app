document.addEventListener('DOMContentLoaded', () => {
    const roomsTab = document.getElementById('rooms');

    async function fetchRooms() {
        try {
            const response = await fetch('/rooms');
            const rooms = await response.json();
            console.log('Fetched rooms:', rooms);
            renderRooms(rooms);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    }

    function renderRooms(rooms) {
        roomsTab.innerHTML = `
            <h2>Rooms</h2>
            <div id="room-list"></div>
        `;

        const roomListContainer = document.getElementById('room-list');
        const levels = {};
        rooms.forEach(room => {
            if (!levels[room.level]) {
                levels[room.level] = [];
            }
            levels[room.level].push(room);
        });

        Object.keys(levels).sort((a, b) => a - b).forEach(level => {
            const levelContainer = document.createElement('div');
            levelContainer.classList.add('level-container');

            const levelHeader = document.createElement('div');
            levelHeader.classList.add('level-header');
            levelHeader.innerHTML = `Level ${level} <span class="toggle-btn">[+]</span>`;
            levelHeader.dataset.level = level;

            const roomItems = document.createElement('div');
            roomItems.classList.add('room-items');
            roomItems.style.display = 'none';

            levels[level].forEach(room => {
                if (!room.room_id) {
                    console.error('Room ID is undefined:', room);
                    return;
                }

                const roomCard = document.createElement('div');
                roomCard.classList.add('room-card', room.status.toLowerCase());
                roomCard.dataset.id = room.room_id;

                roomCard.innerHTML = `
                    <div class="room-header">${room.room_number} - ${room.type}</div>
                    <div class="room-body">
                        <p><strong>Status:</strong> ${room.status.charAt(0).toUpperCase() + room.status.slice(1)}</p>
                        <p><strong>Level:</strong> ${room.level}</p>
                        <p>${room.description || 'No description available'}</p>

                        <div class="visitor-toggle-container">
                            <label for="visitor-toggle-${room.room_id}">Visitor Status:</label>
                            <label class="switch">
                                <input type="checkbox" id="visitor-toggle-${room.room_id}" ${room.visitor_status ? "checked" : ""}>
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
                `;

                // Add event listener for visitor toggle switch
                const visitorToggle = roomCard.querySelector(`#visitor-toggle-${room.room_id}`);
                visitorToggle.addEventListener('click', async (event) => {
                    event.stopPropagation(); // Prevent opening the popup
                    const newVisitorStatus = event.target.checked;
                    console.log(`Updating visitor status for Room ID: ${room.room_id}, New Status: ${newVisitorStatus}`);
                    await updateVisitorStatus(room.room_id, newVisitorStatus);
                });

                // Add event listener to open status popup (except for visitor toggle)
                roomCard.addEventListener('click', (event) => {
                    if (!event.target.closest('.visitor-toggle-container')) {
                        openStatusPopup(room);
                    }
                });

                roomItems.appendChild(roomCard);
            });

            levelContainer.appendChild(levelHeader);
            levelContainer.appendChild(roomItems);
            roomListContainer.appendChild(levelContainer);

            levelHeader.addEventListener('click', () => {
                if (roomItems.style.display === 'none' || roomItems.style.display === '') {
                    roomItems.style.display = 'grid';
                    levelHeader.querySelector('.toggle-btn').textContent = '[-]';
                } else {
                    roomItems.style.display = 'none';
                    levelHeader.querySelector('.toggle-btn').textContent = '[+]';
                }
            });
        });
    }

    function openStatusPopup(room) {
        if (!room.room_id) {
            console.error('Invalid room data for popup:', room);
            return;
        }

        const popup = document.createElement('div');
        popup.classList.add('popup-overlay');
        popup.innerHTML = `
            <div class="popup-box">
                <h3>Update Room Status</h3>
                <p>Room: ${room.room_number} - ${room.type}</p>
                <div class="status-buttons">
                    <button class="status-btn" data-status="available">Available</button>
                    <button class="status-btn" data-status="assigned">Assigned</button>
                    <button class="status-btn" data-status="occupied">Occupied</button>
                    <button class="status-btn" data-status="dirty">Dirty</button>
                    <button class="status-btn" data-status="completed">Completed</button>
                </div>
                <button id="close-popup">Cancel</button>
            </div>
        `;

        document.body.appendChild(popup);

        document.querySelectorAll('.status-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const newStatus = event.target.dataset.status;
                console.log('Updating status for room ID:', room.room_id, 'New Status:', newStatus);
                await updateRoomStatus(room.room_id, newStatus);
                document.body.removeChild(popup);
            });
        });

        document.getElementById('close-popup').addEventListener('click', () => {
            document.body.removeChild(popup);
        });
    }

    async function updateRoomStatus(roomId, status) {
        try {
            const response = await fetch(`/rooms/${roomId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                console.log('Room status updated successfully:', roomId);
                fetchRooms();
            } else {
                console.error('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating room status:', error);
        }
    }

    async function updateVisitorStatus(roomId, visitorStatus) {
        try {
            const response = await fetch(`/rooms/${roomId}/visitor_status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visitor_status: visitorStatus })
            });
            if (response.ok) {
                console.log(`Visitor status updated successfully for Room ID: ${roomId}`);
            } else {
                console.error('Failed to update visitor status');
            }
        } catch (error) {
            console.error('Error updating visitor status:', error);
        }
    }

    fetchRooms();
});
