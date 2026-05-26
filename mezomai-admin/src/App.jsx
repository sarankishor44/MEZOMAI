import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Characters from './pages/Characters';
import Settings from './pages/Settings';
import Login, { isAdminLoggedIn, setAdminLoggedIn } from './pages/Login';

function App() {
  const [loggedIn, setLoggedIn] = useState(() => isAdminLoggedIn());

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  const logout = () => {
    setAdminLoggedIn(false);
    setLoggedIn(false);
  };

  return (
    <Router>
      <div className="app-container">
        <Sidebar onLogout={logout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/characters" element={<Characters />} />
            <Route path="/settings" element={<Settings />} />
            {/* Fallback route */}
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
