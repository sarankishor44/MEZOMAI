const Users = () => {
  const users = [
    { id: 1, name: 'Alex Vance', email: 'alex@example.com', status: 'active', role: 'User' },
    { id: 2, name: 'Sarah Connor', email: 'sarah@example.com', status: 'active', role: 'Premium' },
    { id: 3, name: 'John Smith', email: 'john@example.com', status: 'inactive', role: 'User' },
  ];

  return (
    <div>
      <header className="page-header">
        <h1>User Management</h1>
        <button className="holo-btn">Add User</button>
      </header>

      <section className="cyber-panel">
        <div className="cyber-table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>#{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <span className={`badge ${user.status}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <button style={{ 
                      background: 'transparent', 
                      border: '1px solid var(--accent-cyan)', 
                      color: 'var(--accent-cyan)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Users;
