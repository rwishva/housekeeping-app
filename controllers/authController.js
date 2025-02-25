const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET || 'your_secret_key';

// Dummy User Database
const users = [
    { id: 1, username: 'manager', password: '1234', role: 'manager' },
    { id: 2, username: 'housekeeper', password: '1234', role: 'housekeeper' }
];

exports.loginUser = (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, secretKey, { expiresIn: '5h' });

    res.cookie('token', token, { httpOnly: true, secure: false });
    res.json({ message: 'Login successful', role: user.role });
};

exports.logoutUser = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
};
