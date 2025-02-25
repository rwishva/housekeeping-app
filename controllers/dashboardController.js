const path = require('path');

exports.getDashboard = (req, res) => {
    const role = req.user.role;
    res.sendFile(path.join(__dirname, `views/dashboard.html?role=${role}`));
};
