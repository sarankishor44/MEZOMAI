import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LogOut, Users, Settings, Activity } from 'lucide-react';

const Sidebar = ({ onLogout }) => {
  return (
    <aside className="sidebar">
      <div className="brand">
        <Activity color="var(--accent-cyan)" />
        MEZOMAI
      </div>
      <nav className="nav-links">
        <NavLink 
          to="/" 
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <LayoutDashboard />
          Dashboard
        </NavLink>
        <NavLink 
          to="/users" 
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <Users />
          User Management
        </NavLink>
        <NavLink 
          to="/characters" 
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <Activity />
          Characters
        </NavLink>
        <NavLink 
          to="/settings" 
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          <Settings />
          Settings
        </NavLink>
      </nav>
      <button className="nav-link logout-link" onClick={onLogout}>
        <LogOut />
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
