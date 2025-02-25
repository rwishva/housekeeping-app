document.addEventListener('DOMContentLoaded', () => {
    const tasksTab = document.getElementById('tasks');
    const userData = localStorage.getItem('user');
    
    if (!userData) {
        alert('User not logged in. Please log in to continue.');
        return;
    }

    const user = JSON.parse(userData);
    const userId = user.id;

    // Inject Tasks HTML dynamically
    tasksTab.innerHTML = `
        <h2>Tasks</h2>
        <button id="create-task-btn">Create Task</button>
        <table id="tasks-table">
            <thead>
                <tr>
                    <th>Task ID</th>
                    <th>Task Type</th>
                    <th>Room</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th>Started</th>
                    <th>Ended</th>
                    <th>Created Date</th>
                    <th>Created By</th>
                    <th>Estimated Time (mins)</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>

        <div id="task-modal" class="modal">
            <div class="modal-content">
                <span class="close-btn">&times;</span>
                <h2>Create New Task</h2>
                <form id="task-form">
                    <label for="task-type">Task Type:</label>
                    <select id="task-type" required></select>

                    <div id="room-select-container" style="display: none;">
                        <label for="room-id">Room:</label>
                        <select id="room-id"></select>
                    </div>

                    <label for="priority">Priority:</label>
                    <select id="priority" required>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>

                    <label for="description">Description:</label>
                    <textarea id="description"></textarea>

                    <label for="estimated-time">Estimated Time (mins):</label>
                    <select id="estimated-time" required>
                        <option value="5">5 Mins</option>
                        <option value="15">15 Mins</option>
                        <option value="30">30 Mins</option>
                    </select>

                    <button type="submit">Create Task</button>
                </form>
            </div>
        </div>
    `;

    const taskTypeSelect = document.getElementById('task-type');
    const roomSelectContainer = document.getElementById('room-select-container');
    const roomSelect = document.getElementById('room-id');
    const createTaskBtn = document.getElementById('create-task-btn');
    const taskModal = document.getElementById('task-modal');
    const closeBtn = document.querySelector('.close-btn');
    const taskForm = document.getElementById('task-form');
    const tasksTableBody = document.querySelector('#tasks-table tbody');

    async function fetchTaskTypes() {
        try {
            const response = await fetch('/api/task-types');
            if (!response.ok) throw new Error('Failed to fetch task types');

            const taskTypes = await response.json();
            populateTaskTypes(taskTypes);
        } catch (error) {
            console.error(error);
            taskTypeSelect.innerHTML = '<option value="">Failed to load task types</option>';
        }
    }

    function populateTaskTypes(taskTypes) {
        taskTypeSelect.innerHTML = '<option value="" disabled selected>Select a task type</option>';
        taskTypes.forEach(taskType => {
            const option = document.createElement('option');
            option.value = taskType.id;
            option.textContent = taskType.task_type;
            taskTypeSelect.appendChild(option);
        });
    }

    async function fetchRooms(selectedTaskType) {
        try {
            const response = await fetch('/rooms-new');
            if (!response.ok) throw new Error('Failed to fetch rooms');
    
            const rooms = await response.json();
            populateRooms(rooms,selectedTaskType);
        } catch (error) {
            console.error(error);
            roomSelect.innerHTML = '<option value="">Failed to load rooms</option>';
        }
    }
    
    function populateRooms(rooms, roomRequiredTaskType) {
        roomSelect.innerHTML = '<option value="" disabled selected>Select a room</option>';
    
        // Filter rooms based on roomRequiredTaskType
        if (roomRequiredTaskType === 3) {
            rooms = rooms.filter(room => room.cleaning_type_id === 1);
        }
        else if (roomRequiredTaskType === 1) {
            rooms = rooms.filter(room => room.cleaning_type_id !== 1);
        }
        else if (roomRequiredTaskType === 2) {
            rooms = rooms.filter(room => room.cleaning_type_id === 3);
        }
    
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.room_id;
            option.textContent = room.room_number;
            roomSelect.appendChild(option);
        });
    }
    
    taskTypeSelect.addEventListener('change', () => {
        const selectedTaskType = Number(taskTypeSelect.value);
        const roomRequiredTaskTypes = [1, 2, 3];
    
        if (roomRequiredTaskTypes.includes(selectedTaskType)) {
            roomSelectContainer.style.display = 'block';
            fetchRooms(selectedTaskType); // Pass the selectedTaskType to fetchRooms
        } else {
            roomSelectContainer.style.display = 'none';
        }
    });

    createTaskBtn.addEventListener('click', () => taskModal.style.display = 'block');
    closeBtn.addEventListener('click', () => taskModal.style.display = 'none');
    window.addEventListener('click', (e) => e.target === taskModal && (taskModal.style.display = 'none'));
    window.addEventListener('keydown', (e) => e.key === 'Escape' && (taskModal.style.display = 'none'));

    taskForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const taskData = {
            task_type_id: parseInt(taskTypeSelect.value),
            room_id: roomSelectContainer.style.display === 'block' ? parseInt(roomSelect.value) : null,
            task_priority: document.getElementById('priority').value,
            task_description: document.getElementById('description').value.trim() || null,
            estimated_time: parseInt(document.getElementById('estimated-time').value),
            user: userId
        };

        try {
            const response = await fetch('/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData),
            });

            if (response.ok) {
                alert('Task created successfully!');
                taskModal.style.display = 'none';
                fetchTasks();
            } else {
                alert('Failed to create task.');
            }
        } catch (error) {
            console.error('Error creating task:', error);
            alert('Error creating task.');
        }
    });

    async function fetchTasks() {
        try {
            const response = await fetch('/tasks');
            const tasks = await response.json();
            renderTasks(tasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    }

    function renderTasks(tasks) {
        tasksTableBody.innerHTML = '';
        tasks.forEach(task => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${task.id}</td>
                <td>${task.task_type}</td>
                <td>${task.room_number || 'N/A'}</td>
                <td>${task.task_priority}</td>
                <td>${task.task_status}</td>
                <td title="${task.task_description}">${task.task_description || 'N/A'}</td>
                <td>${task.task_started || 'N/A'}</td>
                <td>${task.task_ended || 'N/A'}</td>
                <td>${task.task_created_date ? new Date(task.task_created_date).toISOString().split('T')[0] : 'N/A'}</td>
                <td>${task.task_owner_name || 'N/A'}</td>
                <td>${task.estimated_time}</td>
            `;
            tasksTableBody.appendChild(row);
        });
    }

    fetchTaskTypes();
    fetchTasks();
});
