import React, { useState } from 'react';
import '../styles/ResponsePanel.css';

function ResponsePanel({ response }) {
  const [activeTab, setActiveTab] = useState('body');

  if (!response) {
    return (
      <div className="response-panel">
        <div className="empty-response">
          <p>Execute a request to see the response</p>
        </div>
      </div>
    );
  }

  const getStatusClass = () => {
    if (response.status === 0) return 'error';
    if (response.status >= 200 && response.status < 300) return 'success';
    if (response.status >= 400) return 'error';
    return 'info';
  };

  return (
    <div className="response-panel">
      <div className="response-header">
        <div className="status-info">
          <span className={`status-badge ${getStatusClass()}`}>
            {response.status} {response.statusText}
          </span>
          <span className="duration">{response.duration}ms</span>
        </div>

        <div className="response-tabs">
          <button
            className={activeTab === 'body' ? 'active' : ''}
            onClick={() => setActiveTab('body')}
          >
            Body
          </button>
          <button
            className={activeTab === 'headers' ? 'active' : ''}
            onClick={() => setActiveTab('headers')}
          >
            Headers
          </button>
        </div>
      </div>

      <div className="response-content">
        {activeTab === 'body' && (
          <pre className="response-body">
            {response.error 
              ? response.error 
              : JSON.stringify(response.data, null, 2)}
          </pre>
        )}

        {activeTab === 'headers' && (
          <div className="response-headers">
            {response.headers && Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="header-item">
                <span className="header-key">{key}:</span>
                <span className="header-value">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResponsePanel;
