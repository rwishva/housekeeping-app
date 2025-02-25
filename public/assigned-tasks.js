document.addEventListener('DOMContentLoaded', () => {
    const assignedTasksTab = document.getElementById('assigned-tasks');

    // Inject Assigned Tasks HTML dynamically
    assignedTasksTab.innerHTML = `
        <h2>Assigned Tasks</h2>
        <div id="assigned-tasks-container">
            <div><h3>Members</h3></div>
            <div id="member-tabs" class="member-tabs"></div>
            <div><h3>Groups</h3></div>
            <div id="group-tabs" class="group-tabs"></div>
            <div id="tasks-content" class="tasks-content">
                <h3 id="assigned-tasks-heading">Assigned Tasks</h3>
                <div id="assigned-tasks-list" class="assigned-tasks-list" ondrop="dropTask(event)" ondragover="allowDrop(event)"></div>
            </div>
            <h3>Pending Tasks to assign</h3>
            <div id="all-tasks" class="all-tasks" ondrop="dropTaskToAllTasks(event)" ondragover="allowDrop(event)"></div>
        </div>
    `;

    const memberTabsContainer = document.getElementById('member-tabs');
    const groupTabsContainer = document.getElementById('group-tabs');
    const tasksContentContainer = document.getElementById('assigned-tasks-list');
    const allTasksContainer = document.getElementById('all-tasks');
    const assignedTasksHeading = document.getElementById('assigned-tasks-heading'); // New reference to the heading

    let currentSelectedMember = null;
    let currentSelectedGroup = null;

    // Step 1: Fetch and create member tabs
    window.fetchMembers = async function fetchMembers() {
        try {
            const response = await fetch('/members-to-date');
            const members = await response.json();
            createMemberTabs(members);
        } catch (error) {
            console.error('Error fetching members:', error);
        }
    }

    // Step 4: Fetch and create group tabs
    window.fetchGroups = async function fetchGroups() {
        try {
            const response = await fetch('/groups');
            const groups = await response.json();
            createGroupTabs(groups);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    }

    // Step 4: Create group tabs dynamically
    function createGroupTabs(groups) {
        groupTabsContainer.innerHTML = ''; // Clear previous tabs
        groups.forEach((group, index) => {
            const tab = document.createElement('div');
            tab.classList.add('group-tab');
            tab.dataset.groupId = group.id;
            tab.textContent = group.group_name;
            groupTabsContainer.appendChild(tab);

            // Fetch tasks for the first group by default
            if (index === 0) {
                fetchGroupTasks(group.id);
            }

            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                clearCurrentSelections();
                tab.classList.add('active');

                // Set currently selected group
                currentSelectedGroup = group.id;

                // Update the heading with the group name
                assignedTasksHeading.textContent = `Assigned Tasks for Group (${group.group_name})`;

                // Fetch tasks for selected group
                fetchGroupTasks(group.id);
            });
        });
    }

    // Step 5: Fetch tasks assigned to a selected group
    async function fetchGroupTasks(groupId) {
        try {
            const response = await fetch(`/group_tasks/${groupId}`);
            const tasks = await response.json();
            renderGroupTasks(tasks);
        } catch (error) {
            console.error('Error fetching group tasks:', error);
            tasksContentContainer.innerHTML = '<p>Error loading tasks.</p>';
        }
    }

    // Step 6: Render group tasks
    function renderGroupTasks(tasks) {
        tasksContentContainer.innerHTML = ''; // Clear previous content
        if (tasks.length === 0) {
            tasksContentContainer.innerHTML = '<p>No assigned tasks, Drag & Drop to assign Tasks</p>';
            return;
        }
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Task ID</th>
                    <th>Task Type</th>  
                    <th>Room</th>   
                    <th>Status</th> 
                    <th>Description</th>    
                    <th>Estimated Time (mins)</th>
                </tr>
            </thead>
            <tbody>
                ${tasks.map(task => {
                    const isDraggable = task.task_status !== "Completed" && task.task_status !== "Started"; // Disable dragging if task is Completed or Started
                    return `
                        <tr draggable="${isDraggable}" ${isDraggable ? 'ondragstart="dragTask(event)"' : ''} data-task-id="${task.task_id}" style="background-color: ${getStatusColor(task.task_status)};">
                            <td>${task.task_id}</td>
                            <td>${task.task_type}</td>
                            <td>${task.room_number || 'N/A'}</td>
                            <td>${task.task_status}</td>
                            <td>${task.task_description}</td>
                            <td>${task.estimated_time}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        `;
        tasksContentContainer.appendChild(table);
    }

    // Load groups and their tasks when the page loads
    fetchGroups();

    // Step 2: Create member tabs dynamically
    function createMemberTabs(members) {
        memberTabsContainer.innerHTML = ''; // Clear previous tabs

        members.forEach((member, index) => {
            const tab = document.createElement('div');
            tab.classList.add('member-tab');
            tab.dataset.memberId = member.id;
            tab.textContent = member.name;
            memberTabsContainer.appendChild(tab);

            // Fetch tasks for the first member by default
            if (index === 0) {
                fetchUserTasks(member.id);
            }

            tab.addEventListener('click', () => {
                clearCurrentSelections();
                tab.classList.add('active');

                // Set currently selected member
                currentSelectedMember = member.id;

                // Update the heading with the member name
                assignedTasksHeading.textContent = `Assigned Tasks for Member (${member.name})`;

                // Fetch tasks for selected member
                fetchUserTasks(member.id);
            });
        });
    }

    // Step 3: Fetch tasks assigned to a selected member
    async function fetchUserTasks(memberId) {
        try {
            const response = await fetch(`/usertasks/${memberId}`);
            const tasks = await response.json();
            renderUserTasks(tasks);
        } catch (error) {
            console.error('Error fetching user tasks:', error);
            tasksContentContainer.innerHTML = '<p>Error loading tasks.</p>';
        }
    }

    function clearCurrentSelections() {
        document.querySelectorAll('.member-tab, .group-tab').forEach(tab => tab.classList.remove('active'));
        currentSelectedMember = null;
        currentSelectedGroup = null;
        tasksContentContainer.innerHTML = '<p>Please select a member or group to view tasks.</p>'; // Optional: Clear task list
        assignedTasksHeading.textContent = 'Assigned Tasks'; // Reset the heading
    }

    function getStatusColor(status) {
        switch (status) {
            case "Initiated": return "#9c9c9c";  // Yellow
            case "Assigned": return "#9c9c9c";   // Blue
            case "Started": return "#3498db";    // Green
            case "On Hold": return "#fdb548";    // Orange
            case "Completed": return "#4caf50";  // Dark Gray
            case "Discarded": return "#F44336";  // Red
            case "Unassigned": return "#9c9c9c"; // Light Gray
            default: return "#ffffff";           // Default White
        }
    }

    function renderUserTasks(tasks) {
        tasksContentContainer.innerHTML = ''; // Clear previous content

        // Filter tasks based on currentSelectedGroup
        if (currentSelectedMember) {
            tasks = tasks.filter(task => task.assigned_to_type === "user");
        }

        if (tasks.length === 0) {
            tasksContentContainer.innerHTML = '<p>No assigned tasks, Drag & Drop to assign Tasks</p>';
            return;
        }

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Task ID</th>
                    <th>Task Type</th>
                    <th>Room</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th>Estimated Time (mins)</th>
                </tr>
            </thead>
            <tbody>
                ${tasks.map(task => {
                    const isDraggable = task.task_status !== "Completed" && task.task_status !== "Started"; // Disable dragging if task is Completed or Started
                    return `
                        <tr draggable="${isDraggable}" ${isDraggable ? 'ondragstart="dragTask(event)"' : ''} data-task-id="${task.task_id}" style="background-color: ${getStatusColor(task.task_status)};">
                            <td>${task.task_id}</td>
                            <td>${task.task_type}</td>
                            <td>${task.room_number || 'N/A'}</td>
                            <td>${task.task_status}</td>
                            <td>${task.task_description}</td>
                            <td>${task.estimated_time}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        `;
        tasksContentContainer.appendChild(table);
    }

    // Step 5: Fetch and render all available tasks (only Initiated)
    async function fetchAllTasks() {
        try {
            const response = await fetch('/tasks');
            const tasks = await response.json();

            // Filter tasks to include only "Initiated" or "Unassigned"
            const availableTasks = tasks.filter(task => 
                task.task_status === "Initiated" || task.task_status === "Unassigned"
            );

            renderAllTasks(availableTasks);
        } catch (error) {
            console.error('Error fetching all tasks:', error);
        }
    }

    // Step 6: Render only Initiated tasks (Draggable)
    function renderAllTasks(tasks) {
        allTasksContainer.innerHTML = ''; // Clear previous content
    
        if (tasks.length === 0) {
            allTasksContainer.innerHTML = '<p>No initiated tasks available.</p>';
            return;
        }
    
        // Sort tasks by created date and time
        tasks.sort((a, b) => {
            const dateA = new Date(a.task_created_date);
            const dateB = new Date(b.task_created_date);
            return dateA - dateB; // Ascending order (oldest to newest)
            // Use `return dateB - dateA;` for descending order (newest to oldest)
        });
    
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Task ID</th>
                    <th>Task Type</th>
                    <th>Room</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Created Date</th>
                    <th>Description</th>
                    <th>Estimated Time (mins)</th>
                </tr>
            </thead>
            <tbody>
                ${tasks.map(task => `
                    <tr draggable="true" ondragstart="dragTask(event)" data-task-id="${task.id}" style="background-color: ${getStatusColor(task.task_status)};">
                        <td>${task.id}</td>
                        <td>${task.task_type}</td>
                        <td>${task.room_number || 'N/A'}</td>
                        <td>${task.task_status}</td>
                        <td>${task.task_owner_name}</td>
                        <td>${task.task_created_date ? new Date(task.task_created_date).toISOString().split('T')[0] : 'N/A'}</td>
                        <td>${task.task_description}</td>
                        <td>${task.estimated_time}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        allTasksContainer.appendChild(table);
    }

    // Drag functions
    let isDragging = false;

    window.dragTask = function (event) {
        isDragging = true; // Start of drag
        event.dataTransfer.setData('text/plain', event.target.dataset.taskId);
    };
    
    window.allowDrop = function (event) {
        event.preventDefault();
    };
    
    window.dropTask = async function (event) {
        event.preventDefault();
        isDragging = false; // Drag ended
    
        if (!currentSelectedMember && !currentSelectedGroup) {
            alert('Please select a member or group first!');
            return;
        }
    
        const taskId = event.dataTransfer.getData('text/plain');
    
        const assignedTasks = document.querySelectorAll('#assigned-tasks-list tr');
        for (const taskRow of assignedTasks) {
            if (taskRow.dataset.taskId === taskId) {
                return; // Prevent duplicate assignment
            }
        }
    
        try {
            const assignedToId = currentSelectedMember || currentSelectedGroup;
            const assignedToType = currentSelectedMember ? "user" : "group";
    
            const response = await fetch('/taskassignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    task_id: taskId,
                    assigned_to_id: assignedToId,
                    assigned_to_type: assignedToType,
                    priority: 1
                }),
            });
    
            if (response.ok) {
                if (assignedToType === "user") {
                    fetchUserTasks(assignedToId);
                } else {
                    fetchGroupTasks(assignedToId);
                }
                if (!isDragging) fetchAllTasks(); // Refresh only if not dragging
            } else {
                alert('Failed to assign task.');
            }
        } catch (error) {
            console.error('Error assigning task:', error);
        }
    };
    
    window.dropTaskToAllTasks = async function (event) {
        event.preventDefault();
        isDragging = false; // Drag ended
    
        const taskId = event.dataTransfer.getData('text/plain');
    
        try {
            let assignedToId = null;
            let assignedToType = null;
    
            if (currentSelectedMember) {
                assignedToId = currentSelectedMember;
                assignedToType = 'user';
            } else if (currentSelectedGroup) {
                assignedToId = currentSelectedGroup;
                assignedToType = 'group';
            } else {
                alert('Please select a member or group first!');
                return;
            }
    
            const response = await fetch(`/taskassignments/${taskId}/${assignedToId}/${assignedToType}`, {
                method: 'DELETE',
            });
    
            if (response.ok) {
                if (assignedToType === 'user') {
                    fetchUserTasks(assignedToId);
                } else {
                    fetchGroupTasks(assignedToId);
                }
                if (!isDragging) fetchAllTasks(); // Refresh only if not dragging
            } else {
                alert('Failed to unassign task.');
            }
        } catch (error) {
            console.error('Error unassigning task:', error);
        }
    };
    
    function refreshTables() {
        if (isDragging) return; // Skip refresh if dragging
    
        if (currentSelectedMember) {
            fetchUserTasks(currentSelectedMember);
        } else if (currentSelectedGroup) {
            fetchGroupTasks(currentSelectedGroup);
        }
        fetchAllTasks();
    }
    
    fetchMembers();
    fetchAllTasks();
    
    setInterval(() => {
        if (!isDragging) refreshTables(); // Skip auto-refresh during drag
    }, 5000);
    
});