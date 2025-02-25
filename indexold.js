const express = require('express');
const app = express();
const path = require('path');
app.use(express.json());

const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost', // Change if your MySQL is hosted elsewhere
    user: 'root', // Replace with your MySQL username
    password: 'mysql', // Replace with your MySQL password
    database: 'hk' // Replace with your database name
});

// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

const members = () => {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM members', (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

console.log(members);

// Fetch rooms
const rooms = () => {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM rooms', (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};


// GET /members - Fetch all members
// app.get('/members', (req, res) => {
//     res.json(members);
//   });
app.get('/members', (req, res) => {
    connection.query('SELECT * FROM members', (err, results) => {
        if (err) {
            res.status(500).json({ error: err });
            return;
        }
        res.json(results);
    });
});

app.get('/groups', (req, res) => {
    connection.query('SELECT * FROM date_to_member', (err, results) => {
        if (err) {
            res.status(500).json({ error: err });
            return;
        }
        res.json(results);
    });
});

app.get('/tasks', (req, res) => {
    connection.query('SELECT * FROM tasks', (err, results) => {
        if (err) {
            res.status(500).json({ error: err });
            return;
        }
        res.json(results);
    });
});

app.get('/tasks/:member_id', (req, res) => {
    const memberId = req.params.member_id;
    connection.query('SELECT * FROM tasks WHERE task_owner = ?', [memberId], (err, results) => {
        if (err) {
            res.status(500).json({ error: err });
            return;
        }
        res.json(results);
    });
});


// 📌 API to INSERT or UPDATE when a member is added to a group
app.post('/update-member-group', (req, res) => {
    const { member_id, group_id, is_primary } = req.body;
    const date = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
  
    const sql = `INSERT INTO date_to_member (date, member_id, group_id, is_primary) 
                 VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE group_id = VALUES(group_id), is_primary = VALUES(is_primary)`;
  
    connection.query(sql, [date, member_id, group_id, is_primary], (err, result) => {
      if (err) {
        console.error('Error updating database:', err);
        res.status(500).json({ error: 'Database update failed' });
      } else {
        res.status(200).json({ message: 'Member added to group successfully' });
      }
    });
  });

  app.delete('/remove-member/:member_id', (req, res) => {
    const { member_id } = req.params;
  
    const sql = `DELETE FROM date_to_member WHERE member_id = ?`;
  
    connection.query(sql, [member_id], (err, result) => {
      if (err) {
        console.error('Error deleting record:', err);
        res.status(500).json({ error: 'Failed to remove member from database' });
      } else {
        res.status(200).json({ message: 'Member removed successfully' });
      }
    });
  });

app.post('/tasks', (req, res) => {
    const { task_type, room_id,task_description,task_owner } = req.body;

    const validTaskTypes = ['full clean', 'stay over', 'vc', 'full trolley topup', 'trolley item request'];
    if (!validTaskTypes.includes(task_type.toLowerCase())) {
        return res.status(400).json({ message: `Invalid task type. Allowed values: ${validTaskTypes.join(', ')}` });
    }

    // Task types that must have a room assigned
    const requiresRoom = ['full clean', 'stay over', 'vc'];
    if (requiresRoom.includes(task_type.toLowerCase()) && (!room_id || isNaN(room_id))) {
        return res.status(400).json({ message: `Task type "${task_type}" requires a valid room ID.` });
    }

    // Verify if the room exists
    if (room_id) {
        const roomQuery = `SELECT * FROM rooms WHERE room_id = ?`;
        connection.query(roomQuery, [room_id], (err, results) => {
            if (err) {
                console.error('Error checking room:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: `Room with ID ${room_id} not found.` });
            }

            // Insert task into the database
            const insertQuery = `INSERT INTO tasks (task_type, task_status, room_id,task_description,task_owner) VALUES (?, 'initiated', ?,task_description,?)`;
            connection.query(insertQuery, [task_type, room_id,task_description,task_owner], (err, result) => {
                if (err) {
                    console.error('Error creating task:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                res.json({ message: 'Task created successfully', task_id: result.insertId, task_type, room_id });
            });
        });
    } else {
        // Insert task without a room (only allowed for non-room tasks)
        const insertQuery = `INSERT INTO tasks (task_type, task_status,task_description,task_owner) VALUES (?, 'initiated',?,?)`;
        connection.query(insertQuery, [task_type,task_description,task_owner], (err, result) => {
            if (err) {
                console.error('Error creating task:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({ message: 'Task created successfully', task_id: result.insertId, task_type });
        });
    }
});

  app.get('/members/:date', (req, res) => {
    const { date } = req.params;
    const mem_to_date_q = `
    SELECT m.* 
    FROM date_to_member dm
    JOIN members m ON dm.member_id = m.member_id
    WHERE dm.date = ?;
`;
    connection.query(mem_to_date_q, [date],(err, results) => {
        if (err) {
            res.status(500).json({ error: err });
            return;
        }
        res.json(results);
    });
});
  
//   // GET /rooms - Fetch all rooms
//   app.get('/rooms', (req, res) => {
//     res.json(rooms);
//   });

// API to get rooms
app.get('/rooms', (req, res) => {
    connection.query('SELECT * FROM rooms', (err, results) => {
        if (err) {
            res.status(500).json({ error: err });
            return;
        }
        res.json(results);
    });
});

  // PUT /rooms/:room_id - Update room status
  app.put('/rooms/:room_id', (req, res) => {
    const { room_id } = req.params;
    const { status } = req.body;

    // Ensure status is valid
    const validStatuses = ['dirty', 'clean', 'assigned', 'started', 'onhold', 'completed'];
    if (!validStatuses.includes(status.toLowerCase())) {
        return res.status(400).json({ message: `Invalid status. Allowed values: ${validStatuses.join(', ')}` });
    }

    // Check if the room exists
    const checkRoomQuery = `SELECT * FROM rooms WHERE room_id = ?`;
    connection.query(checkRoomQuery, [room_id], (err, results) => {
        if (err) {
            console.error('Error checking room:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Update room status
        const updateQuery = `UPDATE rooms SET status = ? WHERE room_id = ?`;
        connection.query(updateQuery, [status, room_id], (err) => {
            if (err) {
                console.error('Error updating room status:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({ message: 'Room status updated successfully', room_id, status });
        });
    });
});

// Assign a room to a member
app.post('/assign', (req, res) => {
    const { member_id, room_id } = req.body;

    // Check if the member exists
    const memberQuery = `SELECT * FROM members WHERE member_id = ?`;

    connection.query(memberQuery, [member_id], (err, memberResults) => {
        if (err) {
            console.error('Error fetching member:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (memberResults.length === 0) {
            return res.status(404).json({ message: 'Member not found' });
        }

        const member = memberResults[0]; // First query result (member)

        // Check if the room exists
        const roomQuery = `SELECT * FROM rooms WHERE room_id = ?`;

        connection.query(roomQuery, [room_id], (err, roomResults) => {
            if (err) {
                console.error('Error fetching room:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (roomResults.length === 0) {
                return res.status(404).json({ message: 'Room not found' });
            }

            const room = roomResults[0]; // First query result (room)

            // Validate conditions
            if (!(room.status === 'dirty' || room.status === 'assigned') || member.status !== 'available') {
                return res.status(400).json({ message: 'Assignment failed due to invalid conditions' });
            }

            // Assign room to member
            const assignQuery = `UPDATE rooms SET assigned_member_id = ?, status = 'assigned' WHERE room_id = ?`;
            connection.query(assignQuery, [member_id, room_id], (err) => {
                if (err) {
                    console.error('Error assigning room:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                res.json({ message: 'Room assigned successfully', room_id, member_id });
            });
        });
    });
});


app.get('/workcard/:member_id', (req, res) => {
    const member_id = req.params.member_id;

    // SQL query to get the member details
    const memberQuery = `SELECT * FROM members WHERE member_id = ?`;

    // SQL query to get assigned rooms
    const roomsQuery = `SELECT * FROM rooms WHERE assigned_member_id = ?`;

    // Fetch member details
    connection.query(memberQuery, [member_id], (err, memberResults) => {
        if (err) {
            console.error('Error fetching member:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (memberResults.length === 0) {
            return res.status(404).json({ message: 'Member not found' });
        }

        const member = memberResults[0]; // Get the first member object

        // Fetch assigned rooms
        connection.query(roomsQuery, [member_id], (err, roomsResults) => {
            if (err) {
                console.error('Error fetching rooms:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.json({ member, assignedRooms: roomsResults });
        });
    });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
// Serve the workcard HTML file
app.get('/workcard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'workcard.html'));
  });

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
  });

app.listen(80,'0.0.0.0' , () => console.log('Server running on port 80'));