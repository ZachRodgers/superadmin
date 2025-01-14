import React, { useState } from 'react';
import './Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleLogin = () => {
    if (username === 'superadmin' && password === 'superadmin') {
      localStorage.setItem('isAuthenticated', 'true'); // Store as a string
      window.location.href = '/dashboard'; // Redirect to Dashboard
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src="/assets/LogotypeSuperadmin.svg" alt="Logo" className="logo-superadmin" />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
        {error && <p className="error">{error}</p>}
      </div>
      <footer className="powered-by">
        <img src="/assets/PoweredbyParallelDark.svg" alt="Powered by Parallel" />
      </footer>
    </div>
  );
};

export default Login;
