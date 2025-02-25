const memberId = new URLSearchParams(window.location.search).get('member_id');

// Fetch the workcard data
async function fetchWorkcard() {
  const response = await fetch(`/workcard/${memberId}`);
  const data = await response.json();
  updateTitle(data.member.name); // Update the title with the member's name
  renderWorkcard(data);
}

function updateTitle(memberName) {
  const titleElement = document.getElementById('workcardTitle');
  titleElement.textContent = `Workcard - ${memberName}`;
}

// Render the workcard in a table
function renderWorkcard(data) {
  const tableBody = document.querySelector('#roomsTable tbody');
  const completedTableBody = document.querySelector('#completedRoomsTable tbody');
  tableBody.innerHTML = ''; // Clear existing rows
  completedTableBody.innerHTML = ''; // Clear existing completed rooms

  // Sort the assignedRooms array so that "completed" status rooms are listed last
  data.assignedRooms.sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') {
      return 1; // Move 'completed' status rooms to the end
    } else if (a.status !== 'completed' && b.status === 'completed') {
      return -1; // Keep non-completed status rooms at the beginning
    } else {
      return 0; // Maintain the order for rooms with the same status
    }
  });

  // Iterate over the sorted array and create table rows
  data.assignedRooms.forEach(room => {
    let statusClass = "";
    if (room.status.toLowerCase() === "dirty") statusClass = "dirty";
    else if (room.status.toLowerCase() === "assigned") statusClass = "assigned";
    else if (room.status.toLowerCase() === "clean") statusClass = "clean";
    else if (room.status.toLowerCase() === "started") statusClass = "started";
    else if (room.status.toLowerCase() === "completed") statusClass = "completed";
    else if (room.status.toLowerCase() === "onhold") statusClass = "onhold";

    const row = document.createElement('tr');
    row.classList.add(statusClass);
    row.innerHTML = `
      <td>${room.room_number}</td>
      <td>${room.type}</td>
      <td><span class="status">${capitalizeFirstLetter(room.status)}</span></td>
      <td>
        ${getActionButtons(room)}
      </td>
    `;

    if (room.status.toLowerCase() === 'completed') {
      // Add to completed rooms table
      const completedRow = document.createElement('tr');
      completedRow.classList.add(statusClass);
      completedRow.innerHTML = `
        <td>${room.room_number}</td>
        <td>${room.type}</td>
        <td><span class="status">${capitalizeFirstLetter(room.status)}</span></td>
      `;
      completedTableBody.appendChild(completedRow);
    } else {
      // Add to the main table
      tableBody.appendChild(row);
    }
  });
}

function capitalizeFirstLetter(val) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

// Get action buttons based on room status
function getActionButtons(room) {
  const status = room.status.toLowerCase();
  if (status === 'assigned') {
    return `<button onclick="confirmAndUpdateStatus('${room.room_id}', 'started')">Start</button>`;
  } else if (status === 'started') {
    return `
      <button onclick="confirmAndUpdateStatus('${room.room_id}', 'completed')">Complete</button>
      <button onclick="confirmAndUpdateStatus('${room.room_id}', 'onhold')">Onhold</button>
    `;
  } else if (status === 'onhold') {
    return `<button onclick="confirmAndUpdateStatus('${room.room_id}', 'started')">Start</button>`;
  } else if (status === 'completed' || status === 'dirty') {
    return `<span>${capitalizeFirstLetter(status)}</span>`;
  }
  return '';
}

// Confirm and update room status
async function confirmAndUpdateStatus(roomId, status) {
  const confirmationMessage = `Are you sure you want to update the status to ${status}?`;
  if (confirm(confirmationMessage)) {
    await updateStatus(roomId, status);
  }
}

// Update room status
async function updateStatus(roomId, status) {
  const response = await fetch(`/rooms/${roomId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  const data = await response.json();
  if (response.ok) {
    alert('Status updated successfully');
    fetchWorkcard(); // Refresh the workcard
  } else {
    alert('Failed to update status');
  }
}

// Load workcard on page load
fetchWorkcard();