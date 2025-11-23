import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5215/api/users';

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_BASE);
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch users: ' + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const response = await axios.post(API_BASE, newUser);
      setUsers([...users, response.data]);
      setNewUser({ name: '', email: '' });
      setError('');
    } catch (err) {
      setError('Failed to create user: ' + (err.response?.data || err.message));
    }
  };

  const deleteUser = async (id) => {
    try {
      await axios.delete(`${API_BASE}/${id}`);
      setUsers(users.filter(user => user.id !== id));
      setError('');
    } catch (err) {
      setError('Failed to delete user: ' + (err.response?.data || err.message));
    }
  };

  return (
    <div className="container">
      <h1>User Management</h1>
      
      {error && <div className="error">{error}</div>}

      <form onSubmit={createUser} className="user-form">
        <input
          type="text"
          placeholder="Name"
          value={newUser.name}
          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
        />
        <input
          type="email"
          placeholder="Email"
          value={newUser.email}
          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
        />
        <button type="submit">Add User!!!</button>
      </form>

      {loading ? (
        <div className="loading">Loading users..ss..</div>
      ) : (
        <div className="users-list">
          {users.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-info">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
                <small>Joined: {new Date(user.createdAt).toLocaleDateString()}</small>
              </div>
              <div className="user-actions">
                <button 
                  className="delete-btn"
                  onClick={() => deleteUser(user.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;