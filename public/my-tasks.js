document.addEventListener('DOMContentLoaded', () => {
    const myTasksTab = document.getElementById('my-tasks');
    const userData = localStorage.getItem('user');
    const user = JSON.parse(userData);
    const userId = user?.id;
    const userName = user?.name;

    if (!userId) {
        myTasksTab.innerHTML = '<p>Please log in to view your tasks.</p>';
        return;
    }

    myTasksTab.innerHTML = `
        <h2>My Tasks - ${userName}</h2>
        <div id="my-tasks-container" class="tasks-content">
            <h3>Assigned Tasks</h3>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Room</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="ongoing-tasks-list"></tbody>
                </table>
            </div>
            <h3>Group Tasks</h3>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Room</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="group-tasks-list"></tbody>
                </table>
            </div>
            <h3>Completed Tasks</h3>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Room</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="completed-tasks-list"></tbody>
                </table>
            </div>
        </div>
        <div id="task-tooltip" class="tooltip"></div>
        <div id="task-popup" class="popup">
            <div class="popup-content">
                <span class="close-popup">&times;</span>
                <h3>Update Task</h3>
                <div id="popup-task-details"></div>
                <div id="popup-action-buttons"></div>
            </div>
        </div>
    `;

    const ongoingTasksList = document.getElementById('ongoing-tasks-list');
    const groupTasksList = document.getElementById('group-tasks-list');
    const completedTasksList = document.getElementById('completed-tasks-list');
    const popup = document.getElementById('task-popup');
    const popupTaskDetails = document.getElementById('popup-task-details');
    const popupActionButtons = document.getElementById('popup-action-buttons');
    const closePopup = document.querySelector('.close-popup');

    async function fetchMyTasks() {
        try {
            const response = await fetch(`/usertasks/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch tasks');
            const tasks = await response.json();
            renderTasks(tasks);
        } catch (error) {
            console.error('Error fetching user tasks:', error);
            ongoingTasksList.innerHTML = '<tr><td colspan="3">Error loading tasks.</td></tr>';
        }
    }

    function renderTasks(tasks) {
        const ongoingTasks = tasks.filter(task => task.task_status.toLowerCase() !== 'completed' && task.assigned_to_type === 'user');
        const groupTasks = tasks.filter(task => task.assigned_to_type === 'group' && task.task_status.toLowerCase() !== 'completed');
        const completedTasks = tasks.filter(task => task.task_status.toLowerCase() === 'completed');

        renderTaskList(ongoingTasks, ongoingTasksList, 'No assigned tasks.');
        renderTaskList(groupTasks, groupTasksList, 'No group tasks.');
        renderTaskList(completedTasks, completedTasksList, 'No completed tasks.');
    }

    function renderTaskList(tasks, targetElement, emptyMessage) {
        targetElement.innerHTML = tasks.length === 0
            ? `<tr><td colspan="3">${emptyMessage}</td></tr>`
            : tasks.map(task => `
                <tr class="${getStatusClass(task.task_status)}" onclick="openPopup(${JSON.stringify(task).replace(/"/g, '&quot;')})">
                    <td>${task.task_type || 'N/A'}</td>
                    <td>${task.room_number ? `${task.room_number} ${task.visitor_status == 1 ? "(NG)" : "(G)"}` : 'N/A'}</td>
                    <td><span class="status">${capitalizeFirstLetter(task.task_status)}</span></td>
                </tr>
            `).join('');
    }

    function getStatusClass(status) {
        const statusClassMap = {
            initiated: 'status-initiated',
            assigned: 'status-assigned',
            started: 'status-started',
            'on hold': 'status-onhold',
            completed: 'status-completed',
            discarded: 'status-discarded',
            unassigned: 'status-unassigned',
        };
        return statusClassMap[status.toLowerCase()] || '';
    }

    function capitalizeFirstLetter(val) {
        return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    }

    window.openPopup = function(task) {
        popupTaskDetails.innerHTML = `
            <strong>Task ID:</strong> ${task.task_id}<br>
            <strong>Type:</strong> ${task.task_type}<br>
            <strong>Room:</strong> ${task.room_number || 'N/A'}<br>
            <strong>Visitor Status:</strong> ${task.visitor_status == 1 ? "Not Gone" : "Gone"}<br>
            <strong>Status:</strong> ${capitalizeFirstLetter(task.task_status)}<br>
            <strong>Description:</strong> ${task.task_description || 'N/A'}<br>
            <strong>Estimated Time:</strong> ${task.estimated_time || 'N/A'} mins
        `;

        const status = task.task_status.toLowerCase();
        popupActionButtons.innerHTML = {
            assigned: `<button onclick="updateTaskStatus('${task.task_id}', 'Started')">Start</button>`,
            started: `
                <button onclick="updateTaskStatus('${task.task_id}', 'Completed')">Complete</button>
                <button onclick="updateTaskStatus('${task.task_id}', 'On Hold')">On Hold</button>
            `,
            'on hold': `<button onclick="updateTaskStatus('${task.task_id}', 'Started')">Start</button>`,
            completed: `<span>Completed</span>`,
            discarded: `<span>Discarded</span>`,
        }[status] || '';

        popup.style.display = 'block';
        document.body.classList.add("popup-open");
    };

    closePopup.addEventListener('click', () => {
        popup.style.display = 'none';
        document.body.classList.remove("popup-open");
    });

    window.updateTaskStatus = async function(taskId, status) {
        if (confirm(`Are you sure you want to update the status to ${status}?`)) {
            try {
                const response = await fetch('/tasks/update-status', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ member_id: userId, task_id: taskId, task_status: status })
                });
                if (response.ok) {
                    fetchMyTasks();
                    popup.style.display = 'none';
                } else {
                    alert('Failed to update task status.');
                }
            } catch (error) {
                console.error('Error updating task:', error);
            }
        }
    };

    fetchMyTasks();
    setInterval(fetchMyTasks, 5000);
});