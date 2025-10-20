import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { WebSocketProvider } from '../context/WebSocketContext';
import Sidebar from '../components/Sidebar';
import Workspace from '../components/Workspace';
import ResponsePanel from '../components/ResponsePanel';
import '../styles/Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [response, setResponse] = useState(null);

  return (
    <WebSocketProvider>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>API Manager</h1>
          <div className="user-info">
            <span>{user?.username}</span>
            <button onClick={logout} className="logout-button">Logout</button>
          </div>
        </div>

        <div className="dashboard-content">
          <Sidebar
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            selectedEndpoint={selectedEndpoint}
            setSelectedEndpoint={setSelectedEndpoint}
          />
          
          <Workspace
            selectedProject={selectedProject}
            selectedEndpoint={selectedEndpoint}
            setSelectedEndpoint={setSelectedEndpoint}
            setResponse={setResponse}
          />
          
          <ResponsePanel response={response} />
        </div>
      </div>
    </WebSocketProvider>
  );
}

export default Dashboard;
