import React, { useState, useEffect, useMemo } from 'react';
import API from '../api/axios';
import Allocate from './Allocate';
import "../styles/Admin.css";

const Admin = () => {
  /* ===============================
     CORE STATE
  ================================ */
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([{ id: 1, name: 'Core Analytic Team', members: [] }]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [activeGroup, setActiveGroup] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  /* ===============================
     SEARCH & PAGINATION (MAIN)
  ================================ */
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  /* ===============================
     ASSIGN MODAL CONTROLS
  ================================ */
  const [assignSearch, setAssignSearch] = useState("");
  const [assignDebounced, setAssignDebounced] = useState("");
  const [assignRole, setAssignRole] = useState("ALL");
  const [assignPage, setAssignPage] = useState(1);
  const assignPerPage = 8;

  /* ===============================
     FETCH USERS
  ================================ */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get('/admin/users');
        setUsers(res.data.data);
      } catch {
        setUsers([
            { id: '1', firstName: 'CP', lastName: 'Pilot', username: 'cp_01', email: 'cp@trial.com', mobile: '9876543210', role: 'ADMIN' }, { id: '2', firstName: 'Raj', lastName: 'Kumar', username: 'raj_dev', email: 'raj@test.com', mobile: '9988776655', role: 'USER' }, { id: '3', firstName: 'Amit', lastName: 'Sharma', username: 'amit_analytic', email: 'amit@company.com', mobile: '9123456789', role: 'ANALYTIC' }, { id: '4', firstName: 'Neha', lastName: 'Verma', username: 'neha_sup', email: 'neha@company.com', mobile: '9012345678', role: 'SUPERVISOR' }, { id: '5', firstName: 'Rohit', lastName: 'Singh', username: 'rohit_ops', email: 'rohit@ops.com', mobile: '8899776655', role: 'USER' }, { id: '6', firstName: 'Priya', lastName: 'Mehta', username: 'priya_data', email: 'priya@analytics.com', mobile: '9345678123', role: 'ANALYTIC' }, { id: '7', firstName: 'Vikas', lastName: 'Gupta', username: 'vikas_admin', email: 'vikas@core.com', mobile: '9567812345', role: 'ADMIN' }, { id: '8', firstName: 'Anjali', lastName: 'Patel', username: 'anjali_team', email: 'anjali@team.com', mobile: '9784561230', role: 'USER' }, { id: '9', firstName: 'Suresh', lastName: 'Yadav', username: 'suresh_field', email: 'suresh@field.com', mobile: '9812345670', role: 'SUPERVISOR' }, { id: '10', firstName: 'Karan', lastName: 'Malhotra', username: 'karan_exec', email: 'karan@company.com', mobile: '9900112233', role: 'USER' }, { id: '11', firstName: 'Deepak', lastName: 'Joshi', username: 'deepak_core', email: 'deepak@core.com', mobile: '9823456711', role: 'USER' }, { id: '12', firstName: 'Pooja', lastName: 'Agarwal', username: 'pooja_fin', email: 'pooja@finance.com', mobile: '9811122233', role: 'ANALYTIC' }, { id: '13', firstName: 'Arjun', lastName: 'Rana', username: 'arjun_sup', email: 'arjun@team.com', mobile: '9870011223', role: 'SUPERVISOR' }, { id: '14', firstName: 'Sneha', lastName: 'Kapoor', username: 'sneha_ops', email: 'sneha@ops.com', mobile: '9765432109', role: 'USER' }, { id: '15', firstName: 'Manish', lastName: 'Bansal', username: 'manish_admin', email: 'manish@admin.com', mobile: '9955667788', role: 'ADMIN' }, { id: '16', firstName: 'Riya', lastName: 'Nair', username: 'riya_data', email: 'riya@data.com', mobile: '9845612309', role: 'ANALYTIC' }, { id: '17', firstName: 'Akash', lastName: 'Mishra', username: 'akash_exec', email: 'akash@company.com', mobile: '9876541098', role: 'USER' }, { id: '18', firstName: 'Nitin', lastName: 'Chauhan', username: 'nitin_sup', email: 'nitin@team.com', mobile: '9988123456', role: 'SUPERVISOR' }, { id: '19', firstName: 'Kavita', lastName: 'Rao', username: 'kavita_ana', email: 'kavita@analytics.com', mobile: '9798123456', role: 'ANALYTIC' }, { id: '20', firstName: 'Harsh', lastName: 'Vardhan', username: 'harsh_ops', email: 'harsh@ops.com', mobile: '9911223344', role: 'USER' }, { id: '21', firstName: 'Sonal', lastName: 'Jain', username: 'sonal_fin', email: 'sonal@finance.com', mobile: '9877700112', role: 'USER' }, { id: '22', firstName: 'Rahul', lastName: 'Shetty', username: 'rahul_admin', email: 'rahul@core.com', mobile: '9822012345', role: 'ADMIN' }, { id: '23', firstName: 'Isha', lastName: 'Kohli', username: 'isha_data', email: 'isha@data.com', mobile: '9819988776', role: 'ANALYTIC' }, { id: '24', firstName: 'Tushar', lastName: 'Pandey', username: 'tushar_team', email: 'tushar@team.com', mobile: '9700123456', role: 'USER' }, { id: '25', firstName: 'Mehul', lastName: 'Desai', username: 'mehul_sup', email: 'mehul@ops.com', mobile: '9823344556', role: 'SUPERVISOR' }, { id: '26', firstName: 'Pankaj', lastName: 'Tripathi', username: 'pankaj_exec', email: 'pankaj@company.com', mobile: '9867001234', role: 'USER' }, { id: '27', firstName: 'Shalini', lastName: 'Saxena', username: 'shalini_hr', email: 'shalini@hr.com', mobile: '9799001122', role: 'USER' }, { id: '28', firstName: 'Rakesh', lastName: 'Thakur', username: 'rakesh_admin', email: 'rakesh@admin.com', mobile: '9812340099', role: 'ADMIN' }, { id: '29', firstName: 'Nisha', lastName: 'Kulkarni', username: 'nisha_ana', email: 'nisha@analytics.com', mobile: '9876600112', role: 'ANALYTIC' }, { id: '30', firstName: 'Siddharth', lastName: 'Roy', username: 'sid_ops', email: 'sid@ops.com', mobile: '9898123001', role: 'USER' }
        ]); // fallback handled earlier
      }
    };
    fetchUsers();
  }, []);

  /* ===============================
     DEBOUNCE (MAIN SEARCH)
  ================================ */
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  /* ===============================
     DEBOUNCE (ASSIGN MODAL)
  ================================ */
  useEffect(() => {
    const t = setTimeout(() => {
      setAssignDebounced(assignSearch);
      setAssignPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [assignSearch, assignRole]);

  /* ===============================
     FILTERING (MAIN)
  ================================ */
  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.firstName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      u.lastName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      u.mobile.includes(debouncedSearch)
    );
  }, [users, debouncedSearch]);

  /* ===============================
     FILTERING (ASSIGN MODAL)
  ================================ */
  const filteredAssignUsers = useMemo(() => {
    return users.filter(u => {
      const matchText =
        u.firstName.toLowerCase().includes(assignDebounced.toLowerCase()) ||
        u.lastName.toLowerCase().includes(assignDebounced.toLowerCase()) ||
        u.username.toLowerCase().includes(assignDebounced.toLowerCase());

      const matchRole =
        assignRole === "ALL" || u.role === assignRole;

      return matchText && matchRole;
    });
  }, [users, assignDebounced, assignRole]);

  /* ===============================
     PAGINATION (MAIN)
  ================================ */
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  /* ===============================
     PAGINATION (ASSIGN MODAL)
  ================================ */
  const assignLast = assignPage * assignPerPage;
  const assignFirst = assignLast - assignPerPage;
  const currentAssignUsers = filteredAssignUsers.slice(assignFirst, assignLast);
  const assignTotalPages = Math.ceil(filteredAssignUsers.length / assignPerPage);

  /* ===============================
     HANDLERS
  ================================ */
  const handleUpdateRole = (id, role) => {
    setUsers(users.map(u => u.id === id ? { ...u, role } : u));
  };

  const handleCreateGroup = () => {
    if (!newGroupName) return;
    setGroups([...groups, { id: Date.now(), name: newGroupName, members: [] }]);
    setNewGroupName('');
    setShowGroupModal(false);
  };

  const toggleUserInGroup = (userId) => {
    setGroups(prev =>
      prev.map(g => {
        if (g.id === activeGroup.id) {
          const exists = g.members.includes(userId);
          const updated = exists
            ? g.members.filter(id => id !== userId)
            : [...g.members, userId];
          setActiveGroup({ ...g, members: updated });
          return { ...g, members: updated };
        }
        return g;
      })
    );
  };

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="admin-root">
      <div className="admin-container">

        {/* HEADER */}
        <header className="admin-header">
          <div className="fun-header-text">
            <h1>{activeTab === 'users' ? 'Squad Command 🚀' : 'Data Fortress 🏰'}</h1>
            <div className="tab-nav">
              <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => { setActiveTab('users'); setCurrentPage(1); }}>
                User Management
              </button>
              <button className={`tab-btn ${activeTab === 'allocate' ? 'active' : ''}`}
                onClick={() => setActiveTab('allocate')}>
                Work Allocation
              </button>
            </div>
          </div>

          {activeTab === 'users' && (
            <button className="create-group-btn" onClick={() => setShowGroupModal(true)}>
              + New Squad
            </button>
          )}
        </header>

        {/* USERS TAB */}
        {activeTab === 'users' ? (
          <div className="admin-grid">

            {/* TABLE */}
            <div className="table-wrapper">
              <div className="search-bar-container">
                <div className="search-input-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    className="search-input-field"
                    placeholder="Search by name, username or mobile..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="results-counter">
                  {filteredUsers.length} Pilots Found
                </div>
              </div>

              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Profile</th>
                      <th>Contact</th>
                      <th>Role</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map(u => (
                      <tr key={u.id} className="admin-row">
                        <td>
                          <div className="profile-cell">
                            <div className="avatar">{u.firstName[0]}</div>
                            <div>
                              <div className="name">{u.firstName} {u.lastName}</div>
                              <div className="username">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>{u.email}</div>
                          <div className="username">{u.mobile}</div>
                        </td>
                        <td><span className="role-badge">{u.role}</span></td>
                        <td className="text-right">
                          <select
                            className="role-select"
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                          >
                            <option>USER</option>
                            <option>SUPERVISOR</option>
                            <option>ANALYTIC</option>
                            <option>ADMIN</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              <div className="pagination-bar">
                <div className="pagination-inner">
                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="pagination-controls">
                    <button className="pagination-btn" disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
                    <button className="pagination-btn" disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                  </div>
                </div>
              </div>
            </div>

            {/* GROUP SIDEBAR */}
            <div className="groups-sidebar">
              <div className="group-card-container">
                <h2>📁 Active Groups</h2>
                {groups.map(g => (
                  <div key={g.id} className="group-item">
                    <div className="group-info">
                      <span>{g.name}</span>
                      <span className="member-badge">{g.members.length}</span>
                    </div>
                    <button className="manage-btn"
                      onClick={() => { setActiveGroup(g); setShowAssignModal(true); }}>
                      Manage Members
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Allocate />
        )}
      </div>

      {/* ASSIGN MODAL */}
      {showAssignModal && activeGroup && (
        <div className="modal-overlay">
          <div className="modal-content-large modal-pop">
            <div className="modal-header">
              <h3>Recruit for {activeGroup.name} 👥</h3>
              <button className="close-btn" onClick={() => setShowAssignModal(false)}>✕</button>
            </div>

            {/* SEARCH + ROLE FILTER */}
            <div className="assign-search">
              <input
                placeholder="Search members..."
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
              />
              <select
                className="assign-role-filter"
                value={assignRole}
                onChange={(e) => setAssignRole(e.target.value)}
              >
                <option value="ALL">All Roles</option>
                <option value="USER">User</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ANALYTIC">Analytic</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* MEMBER LIST */}
            <div className="member-selection-list">
              {currentAssignUsers.map(u => {
                const selected = activeGroup.members.includes(u.id);
                return (
                  <div
                    key={u.id}
                    className={`member-select-item ${selected ? 'selected' : ''}`}
                    onClick={() => toggleUserInGroup(u.id)}
                  >
                    <div className="member-profile">
                      <div className="mini-avatar">{u.firstName[0]}</div>
                      <div>
                        <p className="p-name">{u.firstName} {u.lastName}</p>
                        <p className="p-role">{u.role}</p>
                      </div>
                    </div>
                    <div className={`check-circle ${selected ? 'checked' : ''}`}>
                      {selected && '✓'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PAGINATION */}
            <div className="assign-pagination">
              <button disabled={assignPage === 1}
                onClick={() => setAssignPage(p => p - 1)}>Prev</button>
              <span>Page {assignPage} of {assignTotalPages}</span>
              <button disabled={assignPage === assignTotalPages}
                onClick={() => setAssignPage(p => p + 1)}>Next</button>
            </div>

            <button className="done-btn" onClick={() => setShowAssignModal(false)}>
              Deploy Changes ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
