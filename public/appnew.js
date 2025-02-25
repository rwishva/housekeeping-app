document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
  
    // Tab Switching Logic
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs and content
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
  
        // Add active class to the clicked tab and corresponding content
        tab.classList.add('active');
        const targetTab = tab.getAttribute('data-tab');
        document.getElementById(targetTab).classList.add('active');
      });
    });
  
    // Sample Data (Replace with API calls to Node.js backend)
    const members = [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' },
      { id: 3, name: 'Alice Johnson' },
    ];
  
    const rooms = [
      { id: 101, status: 'dirty' },
      { id: 102, status: 'clean' },
      { id: 103, status: 'onhold' },
    ];
  
    const tasks = [
      { id: 1, name: 'Clean Room 101', status: 'started' },
      { id: 2, name: 'Inspect Room 102', status: 'completed' },
      { id: 3, name: 'Restock Room 103', status: 'onhold' },
    ];
  
    // Render Members
    const membersContainer = document.getElementById('members-container');
    members.forEach(member => {
      const memberCard = document.createElement('div');
      memberCard.className = 'member-card';
      memberCard.textContent = member.name;
      membersContainer.appendChild(memberCard);
    });
  
    // Render Rooms
    const roomsContainer = document.getElementById('rooms-container');
    rooms.forEach(room => {
      const roomCard = document.createElement('div');
      roomCard.className = `room-card ${room.status}`;
      roomCard.textContent = `Room ${room.id} (${room.status})`;
      roomsContainer.appendChild(roomCard);
    });
  
    // Render Tasks
    const tasksContainer = document.getElementById('tasks-container');
    tasks.forEach(task => {
      const taskCard = document.createElement('div');
      taskCard.className = `room-card ${task.status}`;
      taskCard.textContent = task.name;
      tasksContainer.appendChild(taskCard);
    });
  
    // Render Assigned Tasks
    const assignedTasksList = document.getElementById('assigned-tasks-list');
    tasks.forEach(task => {
      if (task.status === 'assigned') {
        const assignedTask = document.createElement('li');
        assignedTask.className = `assigned ${task.status}`;
        assignedTask.textContent = task.name;
        assignedTasksList.appendChild(assignedTask);
      }
    });
  });