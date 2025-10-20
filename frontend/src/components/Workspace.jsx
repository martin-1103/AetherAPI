import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useWebSocket } from '../context/WebSocketContext';
import '../styles/Workspace.css';

const API_URL = 'http://localhost:3000/api';

function Workspace({ selectedProject, selectedEndpoint, setSelectedEndpoint, setResponse }) {
  const [name, setName] = useState('');
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState([{ key: '', value: '' }]);
  const [body, setBody] = useState('');
  const [description, setDescription] = useState('');
  const [folder, setFolder] = useState('');
  const [environments, setEnvironments] = useState([]);
  const [selectedEnv, setSelectedEnv] = useState('');
  const [loading, setLoading] = useState(false);
  const { activeUsers, joinRoom } = useWebSocket();

  useEffect(() => {
    if (selectedEndpoint) {
      setName(selectedEndpoint.name);
      setMethod(selectedEndpoint.method);
      setUrl(selectedEndpoint.url);
      setBody(selectedEndpoint.body || '');
      setDescription(selectedEndpoint.description || '');
      setFolder(selectedEndpoint.folder || '');
      
      const parsedHeaders = selectedEndpoint.headers || {};
      const headerArray = Object.keys(parsedHeaders).map(key => ({
        key,
        value: parsedHeaders[key]
      }));
      setHeaders(headerArray.length > 0 ? headerArray : [{ key: '', value: '' }]);

      if (selectedProject) {
        joinRoom(selectedProject.id, selectedEndpoint.id);
      }
    } else {
      resetForm();
    }
  }, [selectedEndpoint]);

  useEffect(() => {
    if (selectedProject) {
      loadEnvironments(selectedProject.id);
    }
  }, [selectedProject]);

  const resetForm = () => {
    setName('New Request');
    setMethod('GET');
    setUrl('https://api.example.com');
    setHeaders([{ key: '', value: '' }]);
    setBody('');
    setDescription('');
    setFolder('');
  };

  const loadEnvironments = async (projectId) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}/environments`);
      setEnvironments(response.data.environments);
    } catch (error) {
      console.error('Error loading environments:', error);
    }
  };

  const handleHeaderChange = (index, field, value) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);

    if (index === headers.length - 1 && (value !== '')) {
      setHeaders([...newHeaders, { key: '', value: '' }]);
    }
  };

  const saveEndpoint = async () => {
    if (!selectedProject) return;

    const headersObj = headers.reduce((acc, h) => {
      if (h.key) acc[h.key] = h.value;
      return acc;
    }, {});

    const endpointData = {
      name,
      method,
      url,
      headers: headersObj,
      body,
      description,
      folder
    };

    try {
      if (selectedEndpoint) {
        const response = await axios.put(`${API_URL}/endpoints/${selectedEndpoint.id}`, endpointData);
        setSelectedEndpoint(response.data.endpoint);
      } else {
        const response = await axios.post(`${API_URL}/projects/${selectedProject.id}/endpoints`, endpointData);
        setSelectedEndpoint(response.data.endpoint);
      }
      alert('Endpoint saved successfully');
    } catch (error) {
      console.error('Error saving endpoint:', error);
      alert('Failed to save endpoint');
    }
  };

  const executeRequest = async () => {
    if (!selectedEndpoint) {
      alert('Please save the endpoint first');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const response = await axios.post(`${API_URL}/endpoints/${selectedEndpoint.id}/execute`, {
        environment: selectedEnv
      });
      setResponse(response.data);
    } catch (error) {
      console.error('Error executing request:', error);
      setResponse({
        status: 0,
        statusText: 'Error',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedProject) {
    return (
      <div className="workspace">
        <div className="empty-state">
          <h2>Select or create a project to get started</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace">
      <div className="workspace-header">
        <input
          type="text"
          className="endpoint-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Request name"
        />
        
        {activeUsers.length > 0 && (
          <div className="active-users">
            <span className="user-count">{activeUsers.length} active</span>
            {activeUsers.map(user => (
              <div key={user.id} className="user-badge" title={user.username}>
                {user.username[0].toUpperCase()}
              </div>
            ))}
          </div>
        )}

        <button onClick={saveEndpoint} className="save-button">Save</button>
      </div>

      <div className="request-config">
        <div className="request-line">
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/endpoint"
            className="url-input"
          />

          <select value={selectedEnv} onChange={(e) => setSelectedEnv(e.target.value)}>
            <option value="">No Environment</option>
            {environments.map(env => (
              <option key={env.id} value={env.id}>{env.name}</option>
            ))}
          </select>

          <button onClick={executeRequest} className="send-button" disabled={loading}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>

        <div className="tabs">
          <div className="tab active">Headers</div>
          <div className="tab">Body</div>
          <div className="tab">Description</div>
        </div>

        <div className="tab-content">
          <div className="headers-section">
            {headers.map((header, index) => (
              <div key={index} className="header-row">
                <input
                  type="text"
                  placeholder="Header name"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="body-section">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"key": "value"}'
              className="body-editor"
            />
          </div>

          <div className="description-section">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this endpoint..."
              className="description-editor"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Workspace;
