document.addEventListener('DOMContentLoaded', () => {
  const membersContainer = document.getElementById('members-container');
  const roomsList = document.getElementById('rooms');

  let members = []; // Store members data
  let rooms = []; // Store rooms data
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
  // Fetch members and rooms
  async function fetchData() {
    try {
      const membersRes = await fetch('/members/2025-01-29');
      members = await membersRes.json();
      const roomsRes = await fetch('/rooms');
      rooms = await roomsRes.json();

      // Fetch assigned rooms per member
      await fetchAssignedRooms();

      // Display rooms
      renderRooms();
      // Display members with assigned rooms
      renderMembers();
      // Add event listeners for drag and drop
      addDragAndDropListeners();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  // Fetch assigned rooms for each member
  async function fetchAssignedRooms() {
    try {
      const updatedMembers = await Promise.all(
        members.map(async (member) => {
          const res = await fetch(`/workcard/${member.member_id}`);
          const data = await res.json();
          return { ...member, assignedRooms: data.assignedRooms || [] };
        })
      );

      // Update members with their assigned rooms
      members = updatedMembers;
    } catch (error) {
      console.error('Error fetching assigned rooms:', error);
    }
  }

// Render only 'dirty' rooms in a table format with status-based styling
function renderRooms() {
  const dirtyRooms = rooms.filter(room => room.status.toLowerCase() === 'dirty'); // Filter only 'dirty' rooms

  roomsList.innerHTML = `
    <table border="1">
      <thead>
        <tr>
          <th>Room Number</th>
          <th>Room Type</th>
          <th>Room Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${dirtyRooms.length > 0 ? dirtyRooms.map(room => `
          <tr class="room-row ${getStatusClass(room.status)}" data-room-id="${room.room_id}" draggable="true">
            <td>${room.room_number}</td>
            <td>${room.type}</td>
            <td>${room.status}</td>
            <td>
              <button class="assign-room-btn" data-room-id="${room.room_id}" draggable="true">Assign</button>
            </td>
          </tr>
        `).join('') : `
          <tr>
            <td colspan="4" style="text-align:center;">No dirty rooms available</td>
          </tr>
        `}
      </tbody>
    </table>
  `;

  // Add event listeners for drag and drop to rooms
  document.querySelectorAll('.assign-room-btn').forEach(button => {
    button.addEventListener('dragstart', handleDragStart);
  });

  // Allow rooms table to receive dropped rooms back
  roomsList.addEventListener('dragover', handleDragOver);
  roomsList.addEventListener('drop', handleDropBackToRooms);
}

// Render members with assigned rooms and apply status-based styling
function renderMembers() {
  membersContainer.innerHTML = members
    .map((member) => {
      return `
      <div class="member-card" data-member-id="${member.member_id}">
        <h3>${member.name}</h3>
        <p>Status: ${member.status}</p>
        <div class="assigned-rooms">
          <h4>Assigned Rooms:</h4>
          <table border="1">
            <thead>
              <tr>
                <th>Room Number</th>
                <th>Room Type</th>
                <th>Room Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                member.assignedRooms.length > 0
                  ? member.assignedRooms
                      .map(
                        (room) => `
                    <tr class="${getStatusClass(room.status)}" data-room-id="${room.room_id}" draggable="true">
                      <td>${room.room_number}</td>
                      <td>${room.type}</td>
                      <td>${room.status}</td>
                    </tr>
                  `
                      )
                      .join('')
                  : `<tr><td colspan="3" style="text-align:center;">No rooms assigned</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
    })
    .join('');

  // Add event listeners for dragging assigned rooms back to the room list
  document.querySelectorAll('.assigned-room').forEach(room => {
    room.addEventListener('dragstart', handleDragStart);
  });

  // Add drop event listener to each member card
  document.querySelectorAll('.member-card').forEach(memberCard => {
    memberCard.addEventListener('dragover', handleDragOver);
    memberCard.addEventListener('drop', handleDropToMember);
  });
}
// Utility function to get the status class for styling
function getStatusClass(status) {
  switch (status.toLowerCase()) {
    case "dirty": return "dirty";
    case "assigned": return "assigned";
    case "clean": return "clean";
    case "started": return "started";
    case "completed": return "completed";
    case "onhold": return "onhold";
    default: return "";
  }
}
// Add drag and drop event listeners
function addDragAndDropListeners() {
  // Attach drag events to all rows in the rooms list
  document.querySelectorAll('.room-row').forEach(row => {
      row.addEventListener('dragstart', handleDragStart);
  });

  // Attach drag events to assigned rooms in member tables
  document.querySelectorAll('.assigned').forEach(row => {
      row.addEventListener('dragstart', handleDragStart);
  });

  // Allow dragging over member cards (so rooms can be dropped onto them)
  document.querySelectorAll('.member-card').forEach(memberCard => {
      memberCard.addEventListener('dragover', handleDragOver);
      memberCard.addEventListener('drop', handleDropToMember);
  });

  // Allow dragging rooms back into the main room list
  roomsList.addEventListener('dragover', handleDragOver);
  roomsList.addEventListener('drop', handleDropBackToRooms);
}

function handleDragStart(event) {
  let rowElement = event.target.closest("tr"); // Always get the closest <tr>

  if (!rowElement || !rowElement.dataset.roomId) {
      console.error("Error: Could not find a valid room row with data-room-id.");
      return;
  }

  let roomId = rowElement.dataset.roomId.trim(); // Get room_id from <tr>

  if (!roomId) {
      console.error("Error: Room ID is missing during drag start!");
      return;
  }

  console.log("Dragging Room ID:", roomId); // Debugging output
  event.dataTransfer.setData("text/plain", roomId); // Store room_id for drop event
}

  // Handle drag over event
  function handleDragOver(event) {
    event.preventDefault(); // Necessary to allow dropping
  }

  // Handle drop event (Assign room to member)
  async function handleDropToMember(event) {
    event.preventDefault();
    const roomId = event.dataTransfer.getData('text/plain');
    const memberId = event.currentTarget.dataset.memberId;

    try {
      const res = await fetch('/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, room_id: roomId }),
      });

      if (res.ok) {
        alert('Room assigned successfully');
        await updateData(); // Fetch updated members and rooms
      } else {
        alert('Assignment failed');
      }
    } catch (error) {
      console.error('Error assigning room:', error);
      alert('Error assigning room');
    }
  }

  // Handle drop event (Unassign room and move back to dirty list)
  async function handleDropBackToRooms(event) {
    event.preventDefault();
    const roomId = event.dataTransfer.getData('text/plain');

    try {
      const res = await fetch(`/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dirty' }),
      });

      if (res.ok) {
        alert('Room unassigned and moved back to dirty list');
        await updateData();
      } else {
        alert('Unassignment failed');
      }
    } catch (error) {
      console.error('Error unassigning room:', error);
      alert('Error unassigning room');
    }
  }

  // Fetch and update all data (including assigned rooms)
  async function updateData() {
    try {
      const membersRes = await fetch('/members');
      members = await membersRes.json();
      const roomsRes = await fetch('/rooms');
      rooms = await roomsRes.json();

      await fetchAssignedRooms();

      renderRooms();
      renderMembers();
      addDragAndDropListeners();
    } catch (error) {
      console.error('Error updating data:', error);
    }
  }

  // Initial data fetch
  fetchData();
});
