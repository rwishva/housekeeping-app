document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('user', JSON.stringify(data));
            window.location.href = `dashboard.html?role=${data.role}`;
            // window.location.href = `dashboard`;
        } else {
            document.getElementById('error-message').textContent = data.message || 'Login failed';
        }
    } catch (error) {
        console.error('Error during login:', error);
        document.getElementById('error-message').textContent = 'An error occurred. Please try again.';
    }
});
