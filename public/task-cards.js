document.addEventListener('DOMContentLoaded', () => {
    const taskCards = document.getElementById('task-cards');
    const userData = localStorage.getItem('user');
    const user = JSON.parse(userData);
    const userId = user.id;
    const userName = user.name;


    function getStatusClass(status) {
        switch (status.toLowerCase()) {
            case 'initiated': return 'status-initiated';
            case 'assigned': return 'status-assigned';
            case 'started': return 'status-started';
            case 'on hold': return 'status-onhold';
            case 'completed': return 'status-completed';
            case 'discarded': return 'status-discarded';
            case 'unassigned': return 'status-unassigned';
            default: return '';
        }
    }
    
    taskCards.innerHTML = `
        <div id="task-container">
            <h2>User Tasks</h2>
            <div id="user-tasks" class="task-cards"></div>
            <h2>Group Tasks</h2>
            <div id="group-tasks" class="task-cards"></div>
        </div>
    `;
    async function fetchUserTasks() {
        fetch(`/usertasks/${userId}`)
            .then((response) => response.json())
            .then((data) => {
                const groupedTasks = data.reduce((acc, task) => {
                    const key = task.assigned_to_type;
                    if (!acc[key]) {
                        acc[key] = [];
                    }
                    acc[key].push(task);
                    return acc;
                }, {});
    
                renderTasks(groupedTasks);
            })
            .catch((error) => {
                console.error('Error fetching tasks:', error);
            });
    }

    function renderTasks(groupedTasks) {
        const userTasksContainer = document.getElementById('user-tasks');
        const groupTasksContainer = document.getElementById('group-tasks');

        userTasksContainer.innerHTML = '';
        groupTasksContainer.innerHTML = '';

        if (groupedTasks.user) {
            const { nonCompleted, completed } = separateTasks(groupedTasks.user);
            nonCompleted.sort((a, b) => b.priority - a.priority);
            nonCompleted.forEach((task) => userTasksContainer.appendChild(createTaskCard(task)));
            completed.forEach((task) => userTasksContainer.appendChild(createTaskCard(task)));
        }

        if (groupedTasks.group) {
            const { nonCompleted, completed } = separateTasks(groupedTasks.group);
            nonCompleted.sort((a, b) => b.priority - a.priority);
            nonCompleted.forEach((task) => groupTasksContainer.appendChild(createTaskCard(task)));
            completed.forEach((task) => groupTasksContainer.appendChild(createTaskCard(task)));
        }

        const cards = document.querySelectorAll('.card');
        cards.forEach((card) => {
            card.addEventListener('click', () => toggleButtons(card));
        });
    }

    function separateTasks(tasks) {
        const completedStatuses = ['completed'];
        const nonCompleted = tasks.filter(task => !completedStatuses.includes(task.task_status.toLowerCase()));
        const completed = tasks.filter(task => completedStatuses.includes(task.task_status.toLowerCase()));
        return { nonCompleted, completed };
    }

    function createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'card';
        const description = task.task_description ? task.task_description : 'N/A';
        const status = task.task_status.toLowerCase();
    
        // Determine the color of the "G" bubble based on visitor_status
        const gBubbleColorClass = task.visitor_status === 0 ? 'bubble-green' : 'bubble-grey';
    
        // Create the card content
        card.innerHTML = `
            <div class="header">
                <div>
                    <strong>${task.task_type}</strong><br>
                    <span class="details">Desc: ${description}</span>
                </div>
                ${task.room_number ? `
                    <div class="room-number">
                        ${task.room_number}
                        <div class="bubbles">
                            <div class="bubble">S</div>
                            <div class="bubble ${gBubbleColorClass}">G</div>
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="distance">Status: ${task.task_status}</div>
            <div class="details">
                <div>Assigned To: ${task.assigned_user_name || 'Group'}</div>
                <div>Estimated Time: ${task.estimated_time} mins</div>
                <div>Created: ${new Date(task.task_created_date).toLocaleString()}</div>
            </div>
            <div class="buttons" style="display: none;">
                ${getButtonsBasedOnStatus(task.task_id, status)}
            </div>
        `;
    
        // Add the task status as a class to the card
        card.classList.add(getStatusClass(status));
    
        // Add click event to show/hide buttons
        card.addEventListener('click', () => {
            const buttonsDiv = card.querySelector('.buttons');
            buttonsDiv.style.display = buttonsDiv.style.display === 'none' ? 'block' : 'none';
        });
    
        return card;
    }
    
    // Helper function to generate buttons based on task status
    function getButtonsBasedOnStatus(taskId, status) {
        let buttons = '';
        if (status === 'assigned') {
            buttons = `<button class="button update" onclick="updateTaskStatus('${taskId}', 'Started')">Start</button>`;
        } else if (status === 'started') {
            buttons = `
                <button class="button review" onclick="updateTaskStatus('${taskId}', 'Completed')">Complete</button>
                <button class="button confirm" onclick="updateTaskStatus('${taskId}', 'On Hold')">On Hold</button>
            `;
        } else if (status === 'on hold') {
            buttons = `<button class="button update" onclick="updateTaskStatus('${taskId}', 'Started')">Start</button>`;
        } else if (status === 'completed' || status === 'discarded') {
            buttons = `<span>${capitalizeFirstLetter(status)}</span>`;
        }
        return buttons;
    }
    
    // Helper function to capitalize the first letter of a string
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Function to call the API when a button is clicked

    window.updateTaskStatus = async function(taskId, status) {
        if (confirm(`Are you sure you want to update the status to ${status}?`)) {
            try {
                const response = await fetch('/tasks/update-status', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ member_id: userId, task_id: taskId, task_status: status })
                });
                if (response.ok) {
                    fetchUserTasks(userId);
                } else {
                    alert('Failed to update task status.');
                }
            } catch (error) {
                console.error('Error updating task:', error);
            }
        }
    }

    function toggleButtons(card) {
        const allCards = document.querySelectorAll('.card');
        allCards.forEach((c) => {
            if (c !== card) {
                c.classList.remove('active');
                c.querySelector('.buttons').style.display = 'none';
            }
        });

        card.classList.toggle('active');
        const buttons = card.querySelector('.buttons');
        buttons.style.display = card.classList.contains('active') ? 'block' : 'none';
    }

    fetchUserTasks();
    setInterval(fetchUserTasks, 5000);
});