import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Sidebar.css';

const API_URL = 'http://localhost:3001/api';

function Sidebar({ selectedProject, setSelectedProject, selectedEndpoint, setSelectedEndpoint }) {
  const [projects, setProjects] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadEndpoints(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects`);
      setProjects(response.data.projects);
      if (response.data.projects.length > 0 && !selectedProject) {
        setSelectedProject(response.data.projects[0]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadEndpoints = async (projectId) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}/endpoints`);
      setEndpoints(response.data.endpoints);
    } catch (error) {
      console.error('Error loading endpoints:', error);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/projects`, {
        name: newProjectName,
        description: ''
      });
      setProjects([...projects, response.data.project]);
      setSelectedProject(response.data.project);
      setNewProjectName('');
      setShowNewProject(false);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const groupedEndpoints = endpoints.reduce((acc, endpoint) => {
    const folder = endpoint.folder || 'Uncategorized';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(endpoint);
    return acc;
  }, {});

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="section-header">
          <h3>Projects</h3>
          <button onClick={() => setShowNewProject(!showNewProject)} className="icon-button">+</button>
        </div>

        {showNewProject && (
          <div className="new-project-form">
            <input
              type="text"
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createProject()}
            />
            <button onClick={createProject}>Create</button>
          </div>
        )}

        <div className="project-list">
          {projects.map(project => (
            <div
              key={project.id}
              className={`project-item ${selectedProject?.id === project.id ? 'active' : ''}`}
              onClick={() => setSelectedProject(project)}
            >
              <span className="project-icon">📁</span>
              {project.name}
            </div>
          ))}
        </div>
      </div>

      {selectedProject && (
        <div className="sidebar-section">
          <div className="section-header">
            <h3>Endpoints</h3>
            <button onClick={() => setSelectedEndpoint(null)} className="icon-button">+</button>
          </div>

          <div className="endpoint-list">
            {Object.entries(groupedEndpoints).map(([folder, folderEndpoints]) => (
              <div key={folder} className="endpoint-folder">
                <div className="folder-name">{folder}</div>
                {folderEndpoints.map(endpoint => (
                  <div
                    key={endpoint.id}
                    className={`endpoint-item ${selectedEndpoint?.id === endpoint.id ? 'active' : ''}`}
                    onClick={() => setSelectedEndpoint(endpoint)}
                  >
                    <span className={`method-badge ${endpoint.method.toLowerCase()}`}>
                      {endpoint.method}
                    </span>
                    <span className="endpoint-name">{endpoint.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
