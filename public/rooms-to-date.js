document.addEventListener('DOMContentLoaded', () => {
    const allRoomsContainer = document.getElementById('all-rooms');
    const stayOverRoomsContainer = document.getElementById('stay-over-rooms');
    const arrivalRoomsContainer = document.getElementById('arrival-rooms');
    const departureRoomsContainer = document.getElementById('departure-rooms');
    const departureArrivalRoomsContainer = document.getElementById('departure-arrival-rooms');

    const roomContainers = [
        allRoomsContainer,
        stayOverRoomsContainer,
        arrivalRoomsContainer,
        departureRoomsContainer,
        departureArrivalRoomsContainer
    ];

    // ✅ Fetch all rooms from /rooms API
    async function fetchAllRooms() {
        try {
            const response = await fetch('/rooms'); // API endpoint for fetching all rooms
            if (!response.ok) {
                throw new Error(`Failed to fetch all rooms: ${response.statusText}`);
            }

            const rooms = await response.json();

            // ✅ Check if the response is an array
            if (Array.isArray(rooms)) {
                renderAllRooms(rooms);
            } else {
                console.error('Invalid data format: Expected an array of rooms.', rooms);
            }

        } catch (error) {
            console.error('Error fetching all rooms:', error);
        }
    }

    // ✅ Fetch rooms for other containers from /rooms-new API
    async function fetchRoomsForContainers() {
        try {
            const response = await fetch('/rooms-new'); // API endpoint for fetching rooms for other containers
            if (!response.ok) {
                throw new Error(`Failed to fetch rooms for containers: ${response.statusText}`);
            }

            const rooms = await response.json();

            // ✅ Check if the response is an array
            if (Array.isArray(rooms)) {
                renderRoomsForContainers(rooms);
            } else {
                console.error('Invalid data format: Expected an array of rooms.', rooms);
            }

        } catch (error) {
            console.error('Error fetching rooms for containers:', error);
        }
    }

    // ✅ Render All Rooms
    function renderAllRooms(rooms) {
        // Clear the "All Rooms" container
        allRoomsContainer.innerHTML = '';

        // Add <h2> tag to the "All Rooms" container
        addHeading(allRoomsContainer, 'All Rooms');

        // Render room cards for "All Rooms"
        rooms.forEach(room => {
            const roomCard = createRoomCard(room);
            allRoomsContainer.appendChild(roomCard);
        });
        hideRoomsFromAllRooms();
    }

    // ✅ Render Rooms for Other Containers
    function renderRoomsForContainers(rooms) {
        // Clear all other containers
        roomContainers.slice(1).forEach(container => container.innerHTML = '');
    
        // Initialize room counts
        let stayOverCount = 0;
        let departureCount = 0;
        let arrivalCount = 0;
        let departureArrivalCount = 0;
    
        // Categorize rooms and count them
        rooms.forEach(room => {
            switch (room.cleaning_type_id) {
                case 1:
                    stayOverCount++;
                    break;
                case 2:
                    departureCount++;
                    break;
                case 3:
                    arrivalCount++;
                    break;
                case 4:
                    departureArrivalCount++;
                    break;
            }
        });
    
        // Update headings with room counts
        addHeading(stayOverRoomsContainer, `Stay Over Rooms (${stayOverCount})`);
        addHeading(arrivalRoomsContainer, `Arrival Rooms (${arrivalCount})`);
        addHeading(departureRoomsContainer, `Departure Rooms (${departureCount})`);
        addHeading(departureArrivalRoomsContainer, `Dep/Arr Rooms (${departureArrivalCount})`);
    
        // Render room cards for each container
        rooms.forEach(room => {
            const roomCard = createRoomCard(room);
    
            switch (room.cleaning_type_id) {
                case 1:
                    stayOverRoomsContainer.appendChild(roomCard);
                    break;
                case 2:
                    departureRoomsContainer.appendChild(roomCard);
                    break;
                case 3:
                    arrivalRoomsContainer.appendChild(roomCard);
                    break;
                case 4:
                    departureArrivalRoomsContainer.appendChild(roomCard);
                    break;
            }
        });
    
        // Add "Create Tasks" button to each container
        addCreateTasksButton(stayOverRoomsContainer);
        addCreateTasksButton(departureRoomsContainer);
        addCreateTasksButton(arrivalRoomsContainer);
        addCreateTasksButton(departureArrivalRoomsContainer);
    
        hideRoomsFromAllRooms();
    }
    

    // Helper function to add <h2> headings
    function addHeading(container, headingText) {
        const heading = document.createElement('h3');
        heading.textContent = headingText;
        container.appendChild(heading);
    }

    // ✅ Create Room Card
    function createRoomCard(room) {
        const roomCard = document.createElement('div');
        roomCard.className = 'room-to-date-card';
        roomCard.draggable = true;
        roomCard.dataset.roomId = room.room_id;
        roomCard.dataset.cleaningTypeId = room.cleaning_type_id || null;
        roomCard.textContent = `Room ${room.room_number || 'Unknown'}`;

        // Add a close button if the room is in specific containers
        if (room.cleaning_type_id) {
            const closeButton = document.createElement('button');
            closeButton.className = 'close-button';
            closeButton.textContent = '×'; // You can use an icon or any symbol here
            closeButton.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevent the drag event from firing
                await removeRoomFromContainer(room.room_id, room.cleaning_type_id);
                roomCard.remove(); // Remove the room card from the DOM
            });
            roomCard.appendChild(closeButton);
        }

        roomCard.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', room.room_id);
        });

        return roomCard;
    }

    // ✅ Remove Room from Container via API
    async function removeRoomFromContainer(roomId, cleaningTypeId) {
        try {
            const response = await fetch(`/rooms/${roomId}/cleaning-type`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                // body: JSON.stringify({ cleaning_type_id: null }) // Reset cleaning_type_id to null
            });
            fetchAllRooms();

            if (!response.ok) {
                console.error(`Failed to update room status: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error updating room status:', error);
        }
    }

    // ✅ Hide Rooms from "All Rooms"
    function hideRoomsFromAllRooms() {
        const allRooms = allRoomsContainer.querySelectorAll('.room-to-date-card');
        allRooms.forEach(roomCard => {
            const roomId = roomCard.dataset.roomId;
            const isPresentElsewhere = [...stayOverRoomsContainer.children, ...arrivalRoomsContainer.children, ...departureRoomsContainer.children, ...departureArrivalRoomsContainer.children]
                .some(card => card.dataset.roomId === roomId);

            roomCard.style.display = isPresentElsewhere ? 'none' : 'block';
        });
    }

    // ✅ Enable Drag & Drop
    function enableDrop(targetContainer, newCleaningTypeId) {
        targetContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        targetContainer.addEventListener('drop', async (e) => {
            e.preventDefault();
            const roomId = e.dataTransfer.getData('text/plain');
            const draggedRoom = document.querySelector(`[data-room-id="${roomId}"]`);

            if (!draggedRoom) return;

            draggedRoom.dataset.cleaningTypeId = newCleaningTypeId;
            targetContainer.appendChild(draggedRoom);
            hideRoomsFromAllRooms();

            // Update the room's cleaning_type_id via API
            await updateRoomCleaningType(roomId, newCleaningTypeId);
        });
    }

    // ✅ Update Room Cleaning Type via API
    async function updateRoomCleaningType(roomId, newCleaningTypeId) {
        try {
            const response = await fetch(`/rooms/${roomId}/cleaning-type`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cleaning_type_id: newCleaningTypeId, status: 'dirty' }) // Set status to 'dirty
            });
            fetchAllRooms();
            fetchRoomsForContainers();
            hideRoomsFromAllRooms();

            if (!response.ok) {
                console.error(`Failed to update room cleaning type: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error updating room cleaning type:', error);
        }
    }

    // ✅ Add "Create Tasks" Button to Each Container
    function addCreateTasksButton(container) {
        const createTasksButton = document.createElement('button');
        createTasksButton.textContent = 'Create Tasks';
        createTasksButton.className = 'create-tasks-button';
        createTasksButton.addEventListener('click', async () => {
            const roomIds = Array.from(container.querySelectorAll('.room-to-date-card'))
                .map(card => card.dataset.roomId);

            if (roomIds.length === 0) {
                alert('No rooms selected for task creation.');
                return;
            }

            // Determine task type based on container ID
            const taskType = getTaskTypeByContainerId(container.id);
            await createTasks(roomIds, taskType);
        });

        container.appendChild(createTasksButton);
    }

    // ✅ Map Container IDs to Task Types
    function getTaskTypeByContainerId(containerId) {
        const taskTypeMap = {
            'stay-over-rooms': 1, // Task type for Stay Over Rooms
            'arrival-rooms': 3,   // Task type for Arrival Rooms
            'departure-rooms': 2, // Task type for Departure Rooms
            'departure-arrival-rooms': 4, // Task type for Departure/Arrival Rooms
        };

        return taskTypeMap[containerId] || null; // Default to null if container ID is not found
    }

    // ✅ Create Tasks via API
    async function createTasks(roomIds, taskType) {
        try {
            const response = await fetch('/create-tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_ids: roomIds, task_type: taskType }),
            });

            if (!response.ok) {
                throw new Error(`Failed to create tasks: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Tasks created successfully:', result);
            alert('Tasks created successfully!');
        } catch (error) {
            console.error('Error creating tasks:', error);
            alert('Failed to create tasks. Please try again.');
        }
    }

    // ✅ Apply Drag-and-Drop Functionality with Cleaning Type IDs
    enableDrop(stayOverRoomsContainer, 1); // Cleaning Type ID 1 for Stay Over
    enableDrop(arrivalRoomsContainer, 3); // Cleaning Type ID 3 for Arrival
    enableDrop(departureRoomsContainer, 2); // Cleaning Type ID 2 for Departure
    enableDrop(departureArrivalRoomsContainer, 4); // Cleaning Type ID 4 for Departure/Arrival

    // ✅ Initial Fetch of Rooms
    fetchRoomsForContainers();
    fetchAllRooms();
});