const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 80;

const cookieParser = require('cookie-parser');
app.use(cookieParser());  // Enable cookie parsing middleware

const secretKey = process.env.JWT_SECRET || 'your_secret_key';
// Middleware
app.use(express.json());

// ────────────────────────────────────────
// Database Connection
// ────────────────────────────────────────
const db = require('./config/db'); // Import MySQL database connection

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request Body:', req.body);
    }
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode}`);
    });
    next();
});

// ────────────────────────────────────────
// CRUD APIs for Members
// ────────────────────────────────────────

// Get all members
app.get('/rooms', (req, res) => {
    db.query('SELECT * FROM rooms', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

app.get('/rooms-new', (req, res) => {
    const query = `
        SELECT 
            r.*,
            rctd.*
        FROM rooms AS r
        INNER JOIN room_cleaning_type_to_date AS rctd 
            ON r.room_id = rctd.room_id
        where rctd.date = CURDATE() 
        ORDER BY r.room_id ASC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching rooms with cleaning data:', err);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.status(200).json(results);
    });
});


// Update room status
app.put('/rooms/:room_id/status', (req, res) => {
    const { room_id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    const query = 'UPDATE rooms SET status = ? WHERE room_id = ?';
    db.query(query, [status, room_id], (err, result) => {
        if (err) {
            console.error('Error updating room status:', err);
            return res.status(500).json({ error: 'Database update failed' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }
        res.json({ message: 'Room status updated successfully' });
    });
});

// Update room status and upsert into room_cleaning_type_to_date
app.put('/rooms/:room_id/cleaning-type', (req, res) => {
    const { room_id } = req.params;
    const { status, cleaning_type_id } = req.body;


    if (!status || !cleaning_type_id) {
        return res.status(400).json({ error: 'Status and cleaning_type_id are required' });
    }

    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Check if record exists for the same room_id and current date
    const checkQuery = `
        SELECT id 
        FROM room_cleaning_type_to_date 
        WHERE room_id = ? AND date = ?
    `;

    db.query(checkQuery, [room_id, currentDate], (err, result) => {
        if (err) {
            console.error('Error checking existing record:', err);
            return res.status(500).json({ error: 'Database query failed' });
        }

        if (result.length > 0) {
            // ✅ Record exists, perform UPDATE
            const updateQuery = `
                UPDATE room_cleaning_type_to_date
                SET current_room_status = 1, cleaning_type_id = ?
                WHERE room_id = ? AND date = ?
            `;

            db.query(updateQuery, [cleaning_type_id, room_id, currentDate], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error('Error updating record:', updateErr);
                    return res.status(500).json({ error: 'Database update failed' });
                }
                return res.json({ message: 'Room cleaning status updated successfully' });
            });
        } else {
            // ✅ Record doesn't exist, perform INSERT
            const insertQuery = `
                INSERT INTO room_cleaning_type_to_date (date, room_id, cleaning_type_id, current_room_status)
                VALUES (?, ?, ?, ?)
            `;
            current_room_status = 5; // Default status
            if(cleaning_type_id == 1){
                current_room_status = 9;
            }
            db.query(insertQuery, [currentDate, room_id, cleaning_type_id, current_room_status], (insertErr, insertResult) => {
                if (insertErr) {
                    console.error('Error inserting record:', insertErr);
                    return res.status(500).json({ error: 'Database insert failed' });
                }
                return res.json({ message: 'Room cleaning status added successfully' });
            });
        }
    });
});

// Update visitor status
app.put('/rooms/:room_id/visitor_status', (req, res) => {
    const { room_id } = req.params;
    const { visitor_status } = req.body;

    if (visitor_status === undefined) {
        return res.status(400).json({ error: 'Visitor status is required' });
    }

    const query = 'UPDATE rooms SET visitor_status = ? WHERE room_id = ?';
    db.query(query, [visitor_status, room_id], (err, result) => {
        if (err) {
            console.error('Error updating visitor status:', err);
            return res.status(500).json({ error: 'Database update failed' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }
        res.json({ message: 'Visitor status updated successfully' });
    });
});

app.delete('/rooms/:room_id/cleaning-type', (req, res) => {
    console.log('Cleaning type delete request received');
    db.query('DELETE FROM room_cleaning_type_to_date WHERE room_id=?', [req.params.room_id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Member deleted successfully' });
    });
});

app.get('/room-details/:roomId', (req, res) => {
    const roomId = req.params.roomId;
  
    // Query to fetch room details, cleaning details, tasks, and assigned members
    const query = `
      SELECT 
    r.*, 
    rctd.date AS cleaning_date, 
    rctd.cleaning_type_id, 
    rs2.status AS cleaning_type,
    rctd.current_room_status,
    rs.status AS current_room_status_name,
    t.id AS task_id, 
    t.task_type_id,
    tt2.task_type AS task_type, 
    t.task_status_id,
    ts.task_status,
    t.task_description, 
    t.task_started, 
    t.task_ended, 
    t.task_created_date, 
    t.task_owner, 
    t.estimated_time, 
    t.task_priority,
    m.id AS member_id, 
    m.name AS member_name,
    m.type AS member_type
FROM 
    rooms r
LEFT JOIN 
    room_cleaning_type_to_date rctd 
    ON r.room_id = rctd.room_id 
    AND rctd.date = CURDATE()
LEFT JOIN 
    room_status rs 
    ON rctd.current_room_status = rs.id
LEFT JOIN 
    room_status rs2 
    ON rctd.cleaning_type_id = rs2.id
LEFT JOIN 
    tasks t 
    ON r.room_id = t.room_id
LEFT JOIN 
    task_type tt2 
    ON tt2.id = t.task_type_id 
LEFT JOIN 
    task_status ts 
    ON ts.id = t.task_status_id 
LEFT JOIN 
    taskassignments ta 
    ON t.id = ta.task_id
LEFT JOIN 
    members m 
    ON ta.assigned_to_id = m.id
WHERE 
    r.room_id = ?

    `;
  
    db.query(query, [roomId], (error, results) => {
      if (error) {
        return res.status(500).send(error);
      }
  
      if (results.length === 0) {
        return res.status(404).send('Room not found');
      }
  
      // Structure the response
      const response = {
        roomDetails: {
          room_id: results[0].room_id,
          room_number: results[0].room_number,
          status: results[0].status,
          type: results[0].type,
          level: results[0].level,
          description: results[0].description,
          visitor_status: results[0].visitor_status
        },
        roomCleaningDetails: {
          cleaning_date: results[0].cleaning_date,
          cleaning_type_id: results[0].cleaning_type_id,
          cleaning_type: results[0].cleaning_type,
          current_room_status: results[0].current_room_status,
          current_room_status_name: results[0].current_room_status_name
        },
        tasks: []
      };
  
      // Group tasks and their assigned members
      const taskMap = new Map();
  
      results.forEach(row => {
        if (row.task_id && !taskMap.has(row.task_id)) {
          taskMap.set(row.task_id, {
            task_id: row.task_id,
            task_type_id: row.task_type_id,
            task_type: row.task_type,
            task_status_id: row.task_status_id,
            task_status: row.task_status,
            task_description: row.task_description,
            task_started: row.task_started,
            task_ended: row.task_ended,
            task_created_date: row.task_created_date,
            task_owner: row.task_owner,
            estimated_time: row.estimated_time,
            task_priority: row.task_priority,
            assigned_members: []
          });
        }
  
        if (row.member_id) {
          const task = taskMap.get(row.task_id);
          task.assigned_members.push({
            member_id: row.member_id,
            member_name: row.member_name,
            member_status: row.member_status,
            member_type: row.member_type,
            user_name: row.user_name,
            phone_number: row.phone_number,
            email: row.email
          });
        }
      });
  
      // Add tasks to the response
      taskMap.forEach(task => {
        response.tasks.push(task);
      });
  
      res.json(response);
    });
  });
  

// ────────────────────────────────────────
// CRUD APIs for Members
// ────────────────────────────────────────

// Get all members
app.get('/members', (req, res) => {
    db.query('SELECT * FROM members', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Get a single member by ID
app.get('/members/:id', (req, res) => {
    db.query('SELECT * FROM members WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results[0]);
    });
});

// Create a new member
app.post('/members', (req, res) => {
    const { name, status, type, user_name, password, phone_number, email } = req.body;
    db.query('INSERT INTO members (name, status, type, user_name, password, phone_number, email) VALUES (?, ?, ?, ?, ?, ?, ?)', 
        [name, status, type, user_name, password, phone_number, email], 
        (err, result) => {
            if (err) return res.status(500).send(err);
            res.json({ id: result.insertId, message: 'Member created successfully' });
        }
    );
});

// Update a member
app.put('/members/:id', (req, res) => {
    const { name, status, type, user_name, password, phone_number, email } = req.body;
    db.query('UPDATE members SET name=?, status=?, type=?, user_name=?, password=?, phone_number=?, email=? WHERE id=?', 
        [name, status, type, user_name, password, phone_number, email, req.params.id], 
        (err) => {
            if (err) return res.status(500).send(err);
            res.json({ message: 'Member updated successfully' });
        }
    );
});

// Delete a member
app.delete('/members/:id', (req, res) => {
    db.query('DELETE FROM members WHERE id=?', [req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Member deleted successfully' });
    });
});

// Get all member to date records
app.get('/members-to-date', (req, res) => {
    db.query('SELECT mtd.member_id as id, mtd.date, m.name, m.status, m.type, m.user_name, m.phone_number, m.email FROM member_to_date mtd INNER JOIN members m ON mtd.member_id = m.id', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Create member to date record
app.post('/add_member_to_date', (req, res) => {
    const { member_id, date } = req.body;
    db.query('INSERT INTO member_to_date (member_id, date) VALUES (?, ?) on duplicate key update member_id = member_id', 
        [member_id, date], 
        (err, result) => {
            if (err) return res.status(500).send(err);
            res.json({ id: result.insertId, message: 'Member created successfully' });
        }
    );
});

// delete member to date record
app.delete('/members-to-date/:id', (req, res) => {
    const { member_id } = req.body;
    db.query('DELETE FROM member_to_date WHERE member_id=?', 
        [req.params.id], 
        (err, result) => {
            if (err) return res.status(500).send(err);
            res.json({ id: result.insertId, message: 'Member deleted successfully' });
        }
    );
});

// ────────────────────────────────────────
// CRUD APIs for Tasks
// ────────────────────────────────────────

// Get all tasks
app.get('/tasks', (req, res) => {
    const query = `
        SELECT 
            tasks.*, 
            task_type.task_type, 
            task_status.task_status,
            r.room_number,
            m.name AS task_owner_name
        FROM 
            tasks 
        JOIN 
            task_type 
        ON 
            tasks.task_type_id = task_type.id 
        JOIN 
            task_status 
        ON 
            tasks.task_status_id = task_status.id
        LEFT JOIN 
            rooms r 
        ON 
            tasks.room_id = r.room_id
        LEFT JOIN 
            members m 
        ON 
            tasks.task_owner = m.id
    `;

    db.query(query, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Get a task by ID
app.get('/tasks/:id', (req, res) => {
    db.query('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results[0]);
    });
});

// Get a task by ID
app.get('/api/task-types', (req, res) => {
    db.query('SELECT * FROM task_type', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});


// Create a new task // old function 
// app.post('/tasks', (req, res) => {
//     const { task_type, room_id, task_status, task_description, task_started, task_ended, task_created_date, task_owner, estimated_time } = req.body;
//     db.query('INSERT INTO tasks (task_type, room_id, task_status, task_description, task_started, task_ended, task_created_date, task_owner, estimated_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
//         [task_type, room_id, task_status, task_description, task_started, task_ended, task_created_date, task_owner, estimated_time], 
//         (err, result) => {
//             if (err) return res.status(500).send(err);
//             res.json({ id: result.insertId, message: 'Task created successfully' });
//         }
//     );
// });

// Create a new task // new function
app.post('/tasks', (req, res) => {
    const { task_type_id, room_id, task_description, task_ended, user, estimated_time } = req.body;

    // List of task_type_ids that require room_id availability check
    const roomCheckRequiredIds = [1, 2, 3, 7]; // Example list, adjust as needed

    // First, check if a task of the same type and current date already exists
    db.query('SELECT * FROM tasks WHERE task_type_id = ? AND task_created_date = CURRENT_DATE', 
        [task_type_id], 
        (err, results) => {
            if (err) return res.status(500).send(err);

            if (results.length > 0) {
                return res.status(400).json({ message: 'A task of the same type already exists for today' });
            }

            // If no duplicate task exists, proceed with the room availability check (if required)
            if (roomCheckRequiredIds.includes(task_type_id)) {
                // Check room availability
                db.query('SELECT * FROM rooms WHERE room_id = ?', [room_id], (err, results) => {
                    if (err) return res.status(500).send(err);
                    if (results.length === 0) {
                        return res.status(400).json({ message: 'Room is not available' });
                    }

                    // Room is available, insert the task with room_id
                    db.query('INSERT INTO tasks (task_type_id, room_id, task_description, task_owner, estimated_time) VALUES (?, ?, ?, ?, ?)', 
                        [task_type_id, room_id, task_description, user, estimated_time], 
                        (err, result) => {
                            if (err) return res.status(500).send(err);
                            res.json({ id: result.insertId, message: 'Task created successfully' });
                        }
                    );
                });
            } else {
                // task_type_id is not in the list, insert without checking room_id
                db.query('INSERT INTO tasks (task_type_id, task_description, task_owner, estimated_time) VALUES (?, ?, ?, ?)', 
                    [task_type_id, task_description, user, estimated_time], 
                    (err, result) => {
                        if (err) return res.status(500).send(err);
                        res.json({ id: result.insertId, message: 'Task created successfully' });
                    }
                );
            }
        }
    );
});

app.post('/create-tasks', (req, res) => {
    const { room_ids, task_type } = req.body;

    if (!room_ids || !Array.isArray(room_ids) || room_ids.length === 0) {
        return res.status(400).json({ message: 'Invalid or empty room_ids' });
    }

    if (![1, 2, 3, 4].includes(task_type)) {
        return res.status(400).json({ message: 'Invalid task_type' });
    }

    // Function to check if a duplicate task exists
    const checkDuplicateTask = (task_type_id, room_id, callback) => {
        db.query(
            'SELECT * FROM tasks WHERE task_type_id = ? AND room_id = ? AND DATE(task_created_date) = CURRENT_DATE',
            [task_type_id, room_id],
            (err, results) => {
                if (err) return callback(err);
                callback(null, results.length > 0); // Returns true if duplicate exists
            }
        );
    };

    // Function to insert a task into the database
    const insertTask = (task_type_id, room_id, callback) => {
        const task_description = 'N/A'; // Default description
        const user = 1; // Default user
        const estimated_time = 15; // Default estimated time

        db.query(
            'INSERT INTO tasks (task_type_id, room_id, task_description, task_owner, estimated_time) VALUES (?, ?, ?, ?, ?)',
            [task_type_id, room_id, task_description, user, estimated_time],
            (err, result) => {
                if (err) return callback(err);
                callback(null, result.insertId);
            }
        );
    };

    // Function to handle task creation based on task_type
    const createTasks = async (room_ids, task_type, callback) => {
        try {
            for (const room_id of room_ids) {
                if (task_type === 1) {
                    // Check for duplicate task with task_type_id=3
                    const isDuplicate = await new Promise((resolve, reject) => {
                        checkDuplicateTask(3, room_id, (err, isDuplicate) => {
                            if (err) return reject(err);
                            resolve(isDuplicate);
                        });
                    });

                    if (!isDuplicate) {
                        await new Promise((resolve, reject) => {
                            insertTask(3, room_id, (err, taskId) => {
                                if (err) return reject(err);
                                resolve(taskId);
                            });
                        });
                    }
                } else if (task_type === 2 || task_type === 4) {
                    // Check for duplicate task with task_type_id=1
                    let isDuplicate = await new Promise((resolve, reject) => {
                        checkDuplicateTask(1, room_id, (err, isDuplicate) => {
                            if (err) return reject(err);
                            resolve(isDuplicate);
                        });
                    });

                    if (!isDuplicate) {
                        await new Promise((resolve, reject) => {
                            insertTask(1, room_id, (err, taskId) => {
                                if (err) return reject(err);
                                resolve(taskId);
                            });
                        });
                    }

                    // Check for duplicate task with task_type_id=2
                    isDuplicate = await new Promise((resolve, reject) => {
                        checkDuplicateTask(2, room_id, (err, isDuplicate) => {
                            if (err) return reject(err);
                            resolve(isDuplicate);
                        });
                    });

                    if (!isDuplicate) {
                        await new Promise((resolve, reject) => {
                            insertTask(2, room_id, (err, taskId) => {
                                if (err) return reject(err);
                                resolve(taskId);
                            });
                        });
                    }

                    // Check for duplicate task with task_type_id=7
                    isDuplicate = await new Promise((resolve, reject) => {
                        checkDuplicateTask(7, room_id, (err, isDuplicate) => {
                            if (err) return reject(err);
                            resolve(isDuplicate);
                        });
                    });

                    if (!isDuplicate) {
                        await new Promise((resolve, reject) => {
                            insertTask(7, room_id, (err, taskId) => {
                                if (err) return reject(err);
                                resolve(taskId);
                            });
                        });
                    }
                } else if (task_type === 3) {
                    // Check for duplicate task with task_type_id=2
                    const isDuplicate = await new Promise((resolve, reject) => {
                        checkDuplicateTask(2, room_id, (err, isDuplicate) => {
                            if (err) return reject(err);
                            resolve(isDuplicate);
                        });
                    });

                    if (!isDuplicate) {
                        await new Promise((resolve, reject) => {
                            insertTask(2, room_id, (err, taskId) => {
                                if (err) return reject(err);
                                resolve(taskId);
                            });
                        });
                    }
                }
            }
            callback(null, 'Tasks created successfully');
        } catch (err) {
            callback(err);
        }
    };

    // Execute the task creation process
    createTasks(room_ids, task_type, (err, message) => {
        if (err) return res.status(500).send(err);
        res.json({ message });
    });
});

// Update only the task status
app.put('/tasks/update-status', (req, res) => {
    const { member_id, task_id, task_status } = req.body;
    if (!member_id || !task_id || !task_status) {
        return res.status(400).json({ message: "Member ID, Task ID, and Task Status are required" });
    }
    const query = `
        UPDATE tasks 
        SET task_status_id = (SELECT id FROM task_status WHERE task_status = ?) 
        WHERE id = ?
    `;
    db.query(query, [task_status, task_id], (err, result) => {
        if (err) {
            console.error('Error updating task status:', err);
            return res.status(500).json({ message: "Database update failed", error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Task not found or status update failed" });
        }
        res.json({ message: 'Task status updated successfully' });
    });
});

// Update a task
app.put('/tasks/:id', (req, res) => {
    const { task_type, room_id, task_status, task_description, task_started, task_ended, task_created_date, task_owner, estimated_time } = req.body;
    db.query('UPDATE tasks SET task_type=?, room_id=?, task_status=?, task_description=?, task_started=?, task_ended=?, task_created_date=?, task_owner=?, estimated_time=? WHERE id=?', 
        [task_type, room_id, task_status, task_description, task_started, task_ended, task_created_date, task_owner, estimated_time, req.params.id], 
        (err) => {
            if (err) return res.status(500).send(err);
            res.json({ message: 'Task updated successfully' });
        }
    );
});

// Delete a task
app.delete('/tasks/:id', (req, res) => {
    db.query('DELETE FROM tasks WHERE id=?', [req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Task deleted successfully' });
    });
});

// ────────────────────────────────────────
// CRUD APIs for Groups
// ────────────────────────────────────────

// Get all groups
app.get('/groups', (req, res) => {
    db.query('SELECT * FROM tgroups', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// API to get all groups with their members
app.get("/groupsfull", (req, res) => {
    const query = `
        SELECT 
            tg.id AS group_id, 
            tg.group_name, 
            tg.group_date, 
            tg.group_master, 
            gm.member_id, 
            m.name AS member_name,
            m.type AS member_type
        FROM tgroups tg
        LEFT JOIN group_members gm ON tg.id = gm.group_id
        LEFT JOIN members m ON gm.member_id = m.id
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching groups:", err);
            return res.status(500).send(err);
        }

        // Transform data to match required format
        const groupsMap = {};

        results.forEach(row => {
            if (!groupsMap[row.group_id]) {
                groupsMap[row.group_id] = {
                    id: row.group_id,
                    group_name: row.group_name,
                    group_date: row.group_date,
                    group_master: row.group_master,
                    group_members: []
                };
            }

            if (row.member_id) { // Avoid null members
                groupsMap[row.group_id].group_members.push({
                    member_id: row.member_id,
                    member_name: row.member_name,
                    member_type: row.member_type
                });
            }
        });

        const response = Object.values(groupsMap);
        res.json(response);
    });
});

// Get a group by ID
app.get('/groups/:id', (req, res) => {
    db.query('SELECT * FROM tgroups WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results[0]);
    });
});

// Create a new group
app.post('/groups', (req, res) => {
    const { group_name, group_date, group_master } = req.body;
    db.query('INSERT INTO tgroups (group_name, group_date, group_master) VALUES (?, ?, ?)', 
        [group_name, group_date, group_master], 
        (err, result) => {
            if (err) return res.status(500).send(err);
            res.json({ id: result.insertId, message: 'Group created successfully' });
        }
    );
});

// Delete a group
app.delete('/groups/:id', (req, res) => {
    const groupId = req.params.id;

    // First, delete all related records in group_members
    db.query('DELETE FROM group_members WHERE group_id = ?', [groupId], (err) => {
        if (err) return res.status(500).send(err);

        // Then, delete the group from tgroups
        db.query('DELETE FROM tgroups WHERE id = ?', [groupId], (err) => {
            if (err) return res.status(500).send(err);
            res.json({ message: 'Group deleted successfully' });
        });
    });
});


app.post('/group_members', (req, res) => {
    const { group_id, member_id } = req.body;

    // First, check if the member is already in another group
    db.query('SELECT group_id FROM group_members WHERE member_id = ?', [member_id], (err, results) => {
        if (err) return res.status(500).send(err);

        if (results.length > 0) {
            const oldGroupId = results[0].group_id;

            // Count members in the old group
            db.query('SELECT COUNT(*) AS member_count FROM group_members WHERE group_id = ?', [oldGroupId], (err, countResults) => {
                if (err) return res.status(500).send(err);
                
                const memberCount = countResults[0].member_count;

                // Remove the member from the old group
                db.query('DELETE FROM group_members WHERE member_id = ?', [member_id], (err) => {
                    if (err) return res.status(500).send(err);

                    if (memberCount === 1) {
                        // If the old group had only one member, delete the group itself
                        db.query('DELETE FROM tgroups WHERE id = ?', [oldGroupId], (err) => {
                            if (err) return res.status(500).send(err);
                            
                            // Now, insert the member into the new group
                            db.query('INSERT INTO group_members (group_id, member_id) VALUES (?, ?)', 
                                [group_id, member_id], 
                                (err, result) => {
                                    if (err) return res.status(500).send(err);
                                    res.json({ message: 'Member moved to new group, old group deleted' });
                                }
                            );
                        });
                    } else {
                        // If the old group still has members, just move the member
                        db.query('INSERT INTO group_members (group_id, member_id) VALUES (?, ?)', 
                            [group_id, member_id], 
                            (err, result) => {
                                if (err) return res.status(500).send(err);
                                res.json({ message: 'Member moved to new group successfully' });
                            }
                        );
                    }
                });
            });
        } else {
            // If the member is not in any group, insert them directly
            db.query('INSERT INTO group_members (group_id, member_id) VALUES (?, ?)', 
                [group_id, member_id], 
                (err, result) => {
                    if (err) return res.status(500).send(err);
                    res.json({ message: 'Member added to group successfully' });
                }
            );
        }
    });
});


// ────────────────────────────────────────
// CRUD APIs for Task Assignments
// ────────────────────────────────────────

// Get all task assignments
app.get('/taskassignments', (req, res) => {
    db.query('SELECT * FROM taskassignments', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Get a task assignment by ID
app.get('/taskassignments/:id', (req, res) => {
    db.query('SELECT * FROM taskassignments WHERE assignment_id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).json({ message: "Assignment not found" });
        res.json(results[0]);
    });
});

// Assign a task to a user and update status to Assigned
app.post('/taskassignments', (req, res) => {
    const { task_id, assigned_to_id, assigned_to_type, priority } = req.body;

    if (!task_id || !assigned_to_id || !assigned_to_type || !priority) {
        return res.status(400).json({ message: "All fields are required" });
    }

    db.beginTransaction(err => {
        if (err) return res.status(500).send(err);

        db.query(
            'INSERT INTO taskassignments (task_id, assigned_to_id, assigned_to_type, priority) VALUES (?, ?, ?, ?)', 
            [task_id, assigned_to_id, assigned_to_type, priority], 
            (err, result) => {
                if (err) {
                    return db.rollback(() => res.status(500).send(err));
                }

                db.query(
                    'UPDATE tasks SET task_status_id = 2 WHERE id = ?', 
                    [task_id], 
                    (err) => {
                        if (err) return db.rollback(() => res.status(500).send(err));

                        db.commit(err => {
                            if (err) return db.rollback(() => res.status(500).send(err));
                            res.json({ message: 'Task assigned and status updated to Assigned' });
                        });
                    }
                );
            }
        );
    });
});

// Unassign task and update status to Unassigned
app.delete('/taskassignments/:task_id/:user_id/:assigned_to_type', (req, res) => {
    const { task_id, user_id, assigned_to_type } = req.params;

    if (!task_id || !user_id || !assigned_to_type) {
        return res.status(400).json({ message: "Task ID, User ID, and Assigned Type are required" });
    }

    db.beginTransaction(err => {
        if (err) return res.status(500).send(err);

        db.query(
            'DELETE FROM taskassignments WHERE task_id = ? AND assigned_to_id = ? AND assigned_to_type = ?', 
            [task_id, user_id, assigned_to_type], 
            (err, result) => {
                if (err) {
                    return db.rollback(() => res.status(500).send(err));
                }

                db.query(
                    'UPDATE tasks SET task_status_id = 7 WHERE id = ?', 
                    [task_id], 
                    (err) => {
                        if (err) return db.rollback(() => res.status(500).send(err));

                        db.commit(err => {
                            if (err) return db.rollback(() => res.status(500).send(err));
                            res.json({ message: 'Task unassigned and status updated to Unassigned' });
                        });
                    }
                );
            }
        );
    });
});

// Update a task assignment
app.put('/taskassignments/:id', (req, res) => {
    const { task_id, assigned_to_id, assigned_to_type, priority } = req.body;

    if (!task_id || !assigned_to_id || !assigned_to_type || !priority) {
        return res.status(400).json({ message: "All fields are required" });
    }

    db.query('UPDATE taskassignments SET task_id=?, assigned_to_id=?, assigned_to_type=?, priority=? WHERE assignment_id=?', 
        [task_id, assigned_to_id, assigned_to_type, priority, req.params.id], 
        (err) => {
            if (err) return res.status(500).send(err);
            res.json({ message: 'Task assignment updated successfully' });
        }
    );
});

// Delete a task assignment
app.delete('/taskassignments/:id', (req, res) => {
    db.query('DELETE FROM taskassignments WHERE assignment_id=?', [req.params.id], (err) => {
        if (err) return res.status(500).send(err);
        res.json({ message: 'Task assignment deleted successfully' });
    });
});

//============ USER tasks ==========================
// Get all task assignments for a specific user
app.get("/usertasks/:id", (req, res) => {
    const userId = req.params.id;

    const query = `
        SELECT 
            ta.assignment_id,
            ta.task_id,
            ta.assigned_to_id,
            ta.assigned_to_type,
            ta.priority,
            t.task_type_id,
            t.room_id,
            r.room_number,
            r.visitor_status,
            t.task_status_id,
            t.task_description,
            t.task_started,
            t.task_ended,
            t.task_created_date,
            t.estimated_time,
            tt.task_type,  -- From task_type table
            ts.task_status,  -- From task_status table
            m.name AS assigned_user_name
        FROM taskassignments ta
        JOIN tasks t ON ta.task_id = t.id
        JOIN task_type tt ON t.task_type_id = tt.id  -- Join task_type table
        JOIN task_status ts ON t.task_status_id = ts.id  -- Join task_status table
        LEFT JOIN members m ON ta.assigned_to_id = m.id AND ta.assigned_to_type = 'user'
        LEFT JOIN rooms r ON t.room_id = r.room_id
        WHERE (
            (ta.assigned_to_type = 'user' AND ta.assigned_to_id = ?)
            OR
            (ta.assigned_to_type = 'group' AND ta.assigned_to_id IN (
                SELECT group_id FROM group_members WHERE member_id = ?
            ))
        )
        ORDER BY ta.priority;
    `;

    db.query(query, [userId, userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

app.get("/group_tasks/:id", (req, res) => {
    const groupId = req.params.id;

    const query = `
        SELECT 
            ta.assignment_id,
            ta.task_id,
            ta.assigned_to_id,
            ta.assigned_to_type,
            ta.priority,
            t.task_type_id,
            t.room_id,
            r.room_number,
            r.visitor_status,
            t.task_status_id,
            t.task_description,
            t.task_started,
            t.task_ended,
            t.task_created_date,
            t.estimated_time,
            tt.task_type,  -- From task_type table
            ts.task_status,  -- From task_status table
            m.name AS assigned_user_name
        FROM taskassignments ta
        JOIN tasks t ON ta.task_id = t.id
        JOIN task_type tt ON t.task_type_id = tt.id  -- Join task_type table
        JOIN task_status ts ON t.task_status_id = ts.id  -- Join task_status table
        LEFT JOIN members m ON ta.assigned_to_id = m.id AND ta.assigned_to_type = 'user'
        LEFT JOIN rooms r ON t.room_id = r.room_id
        WHERE ta.assigned_to_type = 'group' AND ta.assigned_to_id = ?
        ORDER BY ta.priority;
    `;

    db.query(query, [groupId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Authentication Middleware
const authenticateUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/login');
    }
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.redirect('/login');
        }
        req.user = decoded;
        next();
    });
};

// Login API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const query = 'SELECT * FROM members WHERE user_name = ?';
    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            db.connect();
            return res.status(500).json({ message: 'Database error', error: err });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const user = results[0];
        if (password === user.password) {  // Consider using bcrypt for password hashing
            const token = jwt.sign({ id: user.id, username: user.user_name, role: user.type }, secretKey, { expiresIn: '10h' });
            res.cookie('token', token, { httpOnly: true });
            return res.json({ message: 'Login successful', role: user.type,id: user.id, name: user.name });
        } else {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
    });
});


// Create a new task
app.post('/requests', (req, res) => {
    const { requestType, count, user, comment, requestItem } = req.body;
    const updatedComment = ` ${count} ${requestItem}` + " | " + comment ;
    
    db.query('INSERT INTO tasks (task_type_id, task_owner,task_description, task_created_date) VALUES (?, ?, ?, ?)', 
        [requestType, user, updatedComment, new Date()],
        (err, result) => {
            if (err) return res.status(500).send(err);
            res.json({ id: result.insertId, message: 'Task created successfully' });
        }
    );
});

// Get all task assignments for a specific user
app.get("/requests/:ownerId", (req, res) => {
    const ownerId = req.params.ownerId;

    const query = `
        SELECT 
            t.id AS task_id,
            owner.name AS task_owner_name,
            assigned_member.name AS assigned_member_name,
            ts.task_status,
            tt.task_type,
            t.task_description
        FROM tasks t
        JOIN members owner ON t.task_owner = owner.id
        LEFT JOIN taskassignments ta ON t.id = ta.task_id
        LEFT JOIN members assigned_member ON ta.assigned_to_id = assigned_member.id AND ta.assigned_to_type = 'user'
        JOIN task_status ts ON t.task_status_id = ts.id
        JOIN task_type tt ON t.task_type_id = tt.id
        WHERE t.task_owner = ?;
    `;

    db.query(query, [ownerId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});


// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Logout API
app.get('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

// Dashboard Route
app.get('/dashboard', authenticateUser, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// Dashboard Route
app.get('/member-tasks', authenticateUser, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'member-tasks.html'));
});

// Login Page Route
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Dashboard Route
app.get('/room-details', authenticateUser, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'room-details.html'));
});



// ────────────────────────────────────────
// Start Server
// ────────────────────────────────────────
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
