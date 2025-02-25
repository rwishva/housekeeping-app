document.addEventListener('DOMContentLoaded', () => {
    
    const allMembersContainer = document.getElementById('all-members');
    const memberCardsContainer = document.createElement('div');
    memberCardsContainer.id = 'member-cards';
    allMembersContainer.appendChild(memberCardsContainer);
    const membersToDateContainer = document.getElementById('members-to-date');
    const groupsContainer = document.getElementById('groups');
    const legendContainer = document.getElementById('legend-container');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const tasksTableBody = document.querySelector('#tasks-table tbody');
    const assignedTasksTab = document.getElementById("assigned-tasks");
    const initiateRequestTab = document.getElementById("initiate-request");

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and tab contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
    
            // Add active class to the clicked tab and corresponding tab content
            tab.classList.add('active');
            const targetTabContent = document.getElementById(tab.getAttribute('data-tab'));
            targetTabContent.classList.add('active');
    
            // Re-render the content of the active tab
            reRenderTabContent(tab.getAttribute('data-tab'));
        });
    });
    
    function reRenderTabContent(tabId) {
        switch (tabId) {
            case 'members':
                fetchMembersm();
                break;
            case 'rooms':
                break;
            case 'tasks':
                break;
            case 'assigned-tasks':
                fetchMembers();
                fetchGroups();
                break;
            case 'initiate-request':
                //renderInitiateRequest();
                break;
            case 'task-cards':
                //renderInitiateRequest();
                break;
            default:
                console.warn(`Unknown tab ID: ${tabId}`);
        }
    }

    // Define colors for member types
    const memberTypeColors = {
        housekeeper: 'housekeeper',
        manager: 'manager',
        training: 'training',
        supervisor: 'supervisor',
        admin: 'admin',
        default: 'default'
    };

    // Fetch members from API
    async function fetchMembersm() {
        try {
            const response = await fetch('/members'); // Replace with your actual API URL
            const members = await response.json();

            const uniqueTypes = new Set();
            // createAssignedTasksTabs(members);
            members.forEach(member => {
                uniqueTypes.add(member.type);
            });
            renderMembers(members); // Render members after fetching

            generateLegend(uniqueTypes);
        } catch (error) {
            console.error('Error fetching members:', error);
        }
    }

    // Function to render members in the memberCardsContainer

    function renderMembers(members) {
        memberCardsContainer.innerHTML = ''; // Clear existing members
        members.forEach(member => {
            if (member.status === 'available' && !isMemberInGroup(member.id)) {
                const memberCard = createMemberCard(member);
                memberCardsContainer.appendChild(memberCard);
            }
        });
    }
    // Function to check if a member is in any group
    function isMemberInGroup(memberId) {
        const groupCards = document.querySelectorAll('.group-card');
        for (const groupCard of groupCards) {
            const groupMembers = groupCard.querySelectorAll('.member-card');
            for (const member of groupMembers) {
                if (member.dataset.memberId == memberId) {
                    return false; // return true if need to remove from all members list if in group
                }
            }
        }
        return false; // return true if need to remove from all members list if in group
    }

    function createMemberCard(member, isInMembersToDate = false) {
        const memberCard = document.createElement('div');
        memberCard.className = `member-card ${memberTypeColors[member.type] || 'default'}`;
        memberCard.draggable = true;
        memberCard.dataset.memberId = member.id;
    
        // Create a container for the member's name
        const memberName = document.createElement('span');
        memberName.textContent = member.name;
        memberCard.appendChild(memberName);
    
        // Add close button if the member card is in the members-to-date container
        if (isInMembersToDate) {
            const closeButton = document.createElement('button');
            closeButton.className = 'close-button';
            closeButton.textContent = '×';
            closeButton.addEventListener('click', async () => {
                const memberId = memberCard.dataset.memberId; // Get the member ID
                try {
                    // Call the delete API
                    const response = await fetch(`/members-to-date/${memberId}`, {
                        method: 'DELETE',
                    });
    
                    if (response.ok) {
                        // Remove the member card from the DOM if the API call is successful
                        memberCard.remove();
                        console.log(`Member ${memberId} removed from members-to-date.`);
                    } else {
                        console.error('Failed to delete member from members-to-date:', response.statusText);
                    }
                } catch (error) {
                    console.error('Error deleting member from members-to-date:', error);
                }
            });
            memberCard.appendChild(closeButton); // Append close button after the member's name
        }
    
        memberCard.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', member.id);
        });
    
        memberCard.addEventListener('dragover', (e) => {
            if (e.target.id === 'members-to-date') {
                if (!memberCard.querySelector('.close-button')) {
                    const closeButton = document.createElement('button');
                    closeButton.className = 'close-button';
                    closeButton.textContent = '×';
                    closeButton.addEventListener('click', async () => {
                        const memberId = memberCard.dataset.memberId; // Get the member ID
                        try {
                            // Call the delete API
                            const response = await fetch(`/members-to-date/${memberId}`, {
                                method: 'DELETE',
                            });
    
                            if (response.ok) {
                                // Remove the member card from the DOM if the API call is successful
                                memberCard.remove();
                                console.log(`Member ${memberId} removed from members-to-date.`);
                            } else {
                                console.error('Failed to delete member from members-to-date:', response.statusText);
                            }
                        } catch (error) {
                            console.error('Error deleting member from members-to-date:', error);
                        }
                    });
                    memberCard.appendChild(closeButton); // Append close button after the member's name
                }
            } else {
                const closeButton = memberCard.querySelector('.close-button');
                if (closeButton) {
                    closeButton.remove();
                }
            }
        });
    
        return memberCard;
    }
    

    function generateLegend(types) {
        legendContainer.innerHTML ='';
        types.forEach(type => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';

            const colorBox = document.createElement('div');
            colorBox.className = `legend-box ${memberTypeColors[type] || 'default'}`;

            const label = document.createElement('span');
            label.textContent = type.charAt(0).toUpperCase() + type.slice(1); // Capitalize first letter

            legendItem.appendChild(colorBox);
            legendItem.appendChild(label);
            legendContainer.appendChild(legendItem);
        });
    }

    function enableDrop(target) {
        target.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
    
        target.addEventListener('drop', async (e) => {
            e.preventDefault();
            const memberId = e.dataTransfer.getData('text/plain');
            const draggedElement = document.querySelector(`[data-member-id="${memberId}"]`);
    
            if (!draggedElement) return;
    
            if (target.id === 'groups') {
                let existingGroup = null;
    
                if (e.target.classList.contains('group-card')) {
                    existingGroup = e.target;
                } else if (e.target.closest('.group-card')) {
                    existingGroup = e.target.closest('.group-card');
                }
                console.log(existingGroup);
                if (existingGroup) {
                    // Adding member to existing group
                    const groupId = existingGroup.getAttribute('data-group-id');
                    if (groupId) {
                        await addMemberToGroup(groupId, memberId);
                    }
    
                    let groupMembersContainer = existingGroup.querySelector('.group-members');
                    if (!groupMembersContainer) {
                        groupMembersContainer = document.createElement('div');
                        groupMembersContainer.className = 'group-members';
                        existingGroup.appendChild(groupMembersContainer);
                    }
                    groupMembersContainer.appendChild(draggedElement);
                } else {
                    // Creating a new group
                    const groupName = draggedElement.textContent;
                    const groupMaster = memberId; // Assuming the dragged member is the master of the new group
    
                    const newGroup = document.createElement('div');
                    newGroup.className = 'group-card';
                    newGroup.innerHTML = `<strong>Group: ${groupName}</strong>`;
    
                    const groupMembersContainer = document.createElement('div');
                    groupMembersContainer.className = 'group-members';
    
                    newGroup.appendChild(groupMembersContainer);
                    groupMembersContainer.appendChild(draggedElement);
                    target.appendChild(newGroup);
    
                    // Call API to create a new group
                    const groupId = await createNewGroup(groupName, groupMaster);
                    if (groupId) {
                        newGroup.setAttribute('data-group-id', groupId);
                        await addMemberToGroup(groupId, memberId);
                    }
    
                    const emptyMessage = document.querySelector('.empty-group');
                    if (emptyMessage) emptyMessage.style.display = 'none';
                }
            }
            else if(target.id === 'members-to-date') {
                const memberId = draggedElement.dataset.memberId;
                const memberName = draggedElement.textContent;
                const memberType = draggedElement.classList[1]; // Get the second class of the element
                const memberCard = createMemberCard({ id: memberId, name: memberName, type: memberType },true);
                target.appendChild(memberCard);
                const newMemberToDateId = await addMemberToDate(memberId);
                if (newMemberToDateId) {
                    memberCard.setAttribute('data-member-to-date-id', newMemberToDateId);
                }
            }   
            else {
                target.appendChild(draggedElement);
            }

            // Dispatch groupChanged event with a delay
            setTimeout(() => {
                const event = new Event('groupChanged');
                document.dispatchEvent(event);
            }, 500);
        });
    }

    async function addMemberToDate(memberId) {
        const newMemberToDateId = await createNewMemberToDate(memberId);
        await fetchMembersToDate(); // Fetch updated member_to_date from API
        renderMembersToDate(); // Re-render the member_to_date cards
    }
    
    async function fetchMembersToDate() {
        try {
            const response = await fetch('/members-to-date');
            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                console.error('Failed to fetch members to date');
            }
        } catch (error) {
            console.error('Error fetching members to date:', error);
        }
    }
    
    function renderMembersToDate() {
        const membersToDateContainer = document.getElementById('members-to-date');
        membersToDateContainer.innerHTML = '';
        membersToDateContainer.innerHTML = `<h3>Members to Date</h3>`;
    
        fetchMembersToDate().then(members => {
            if (members.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-members';
                emptyMessage.textContent = 'No members available for the date, Drag & Drop members to add.';
                membersToDateContainer.appendChild(emptyMessage);
            } else {
                members.forEach(member => {
                    const memberCard = createMemberCard(member, true);
                    membersToDateContainer.appendChild(memberCard);
                });
            }
        }).catch(error => {
            console.error('Error fetching members:', error);
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Failed to load members. Please try again later.';
            membersToDateContainer.appendChild(errorMessage);
        });
    }


    async function createNewGroup(groupName, groupMaster) {
        try {
            const response = await fetch('/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    group_name: groupName,
                    group_date: new Date().toISOString().split('T')[0],
                    group_master: groupMaster
                })
            });
    
            const result = await response.json();
            return result.id; // Return new group ID
        } catch (error) {
            console.error('Error creating group:', error);
        }
        return null;
    }

    async function createNewMemberToDate(id) {
        try {
            const response = await fetch('/add_member_to_date', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    member_id: parseInt(id),
                    date: new Date().toISOString().split('T')[0],
                })
            });
    
            const result = await response.json();
            return result.id; // Return new group ID
        } catch (error) {
            console.error('Error adding member to date:', error);
        }
        return null;
    }
    
    async function addMemberToGroup(groupId, memberId) {
        try {
            const response = await fetch('/group_members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    group_id: groupId,
                    member_id: memberId
                })
            });
    
            const result = await response.json();
            console.log(result.message);
        } catch (error) {
            console.error('Error adding member to group:', error);
        }
    }
    
    async function fetchAndRenderGroups() {
        try {
            const response = await fetch('/groupsfull'); // Fetch data from the API
            const groups = await response.json();
    
            
            groupsContainer.innerHTML = ''; // Clear existing content
            const groupsHeader = document.createElement('h3');
            groupsHeader.textContent = 'Groups';
            groupsContainer.appendChild(groupsHeader);
    
            if (groups.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-group';
                emptyMessage.textContent = 'No groups available, Drag & Drop members to create a new group';
                groupsContainer.appendChild(emptyMessage);
                return;
            }
    
            groups.forEach(group => {
                const groupCard = document.createElement('div');
                groupCard.className = 'group-card';
                groupCard.setAttribute('data-group-id', group.id);
                const closeButton = document.createElement('button');
                // console.log(closeButton)
                closeButton.className = 'close-button';
                closeButton.textContent = '×';
                closeButton.addEventListener('click', async () => {
                    const groupId = group.id;
                    try {
                        const response = await fetch(`/groups/${groupId}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            groupCard.remove();
                            setTimeout(() => {
                                const event = new Event('groupChanged');
                                document.dispatchEvent(event);
                            }, 500);
                        } else {
                            console.error('Failed to delete group');
                        }
                    } catch (error) {
                        console.error('Error deleting group:', error);
                    }
                });

                groupCard.innerHTML = `<strong>Group: ${group.group_name}</strong>`;
                groupCard.appendChild(closeButton);
    
                const groupMembersContainer = document.createElement('div');
                groupMembersContainer.className = 'group-members';
    
                // First, render the group master at the top
                const groupMaster = group.group_members.find(member => member.member_id === group.group_master);
                if (groupMaster) {
                    const masterElement = document.createElement('div');
                    masterElement.className = `member-card ${memberTypeColors[groupMaster.member_type] || 'default'}`;
                    masterElement.textContent = `${groupMaster.member_name} (Master)`;
                    masterElement.setAttribute('draggable', true);
                    masterElement.setAttribute('data-member-id', groupMaster.member_id);

                    masterElement.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('text/plain', groupMaster.member_id);
                    });

                    groupMembersContainer.appendChild(masterElement);
                }

                // Then, render the rest of the members
                group.group_members.forEach(member => {
                    if (member.member_id !== group.group_master) {
                        const memberElement = document.createElement('div');
                        memberElement.className = `member-card ${memberTypeColors[member.member_type] || 'default'}`;
                        memberElement.textContent = member.member_name;
                        memberElement.setAttribute('draggable', true);
                        memberElement.setAttribute('data-member-id', member.member_id);

                        memberElement.addEventListener('dragstart', (e) => {
                            e.dataTransfer.setData('text/plain', member.member_id);
                        });

                        groupMembersContainer.appendChild(memberElement);
                    }
                });
    
                groupCard.appendChild(groupMembersContainer);
                groupsContainer.appendChild(groupCard);
            });
    
        } catch (error) {
            console.error("Error fetching groups:", error);
        }
    }

    // Function to re-render members in the memberCardsContainer
    function reRenderMembers() {
        fetchMembersm();
    }
    

    enableDrop(allMembersContainer);
    enableDrop(membersToDateContainer);
    enableDrop(groupsContainer);
    document.querySelectorAll('.group-card').forEach(enableDrop);
    
    // fetchMembers();
    // fetchMembersm();
    // fetchTasks(); // Fetch and render tasks when the page loads
    fetchMembersToDate(); // Fetch and render members to date when the page loads
    renderMembersToDate(); // Render members to date after fetching
    fetchAndRenderGroups();
    document.addEventListener('groupChanged', () => {
        fetchAndRenderGroups();
        reRenderMembers();
    });
    fetchMembersm();
});