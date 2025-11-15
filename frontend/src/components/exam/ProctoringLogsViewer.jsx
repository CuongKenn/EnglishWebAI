import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Info, AlertCircle, Filter, TrendingUp, Eye } from 'lucide-react';
import './ProctoringLogsViewer.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ProctoringLogsViewer = ({ submissionId }) => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    info: 0,
    warning: 0,
    critical: 0
  });

  // Fetch logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        const response = await axios.get(
          `${API_BASE_URL}/api/v1/proctoring/proctoring-logs/${submissionId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        const logsData = response.data;
        setLogs(logsData);
        setFilteredLogs(logsData);
        
        // Calculate stats
        const statsData = {
          total: logsData.length,
          info: logsData.filter(log => log.severity === 'info').length,
          warning: logsData.filter(log => log.severity === 'warning').length,
          critical: logsData.filter(log => log.severity === 'critical').length
        };
        setStats(statsData);
        
      } catch (error) {
        console.error('Failed to fetch proctoring logs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (submissionId) {
      fetchLogs();
    }
  }, [submissionId]);

  // Filter logs by severity
  useEffect(() => {
    if (selectedSeverity === 'all') {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(logs.filter(log => log.severity === selectedSeverity));
    }
  }, [selectedSeverity, logs]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get severity icon
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'info':
        return <Info size={18} />;
      case 'warning':
        return <AlertTriangle size={18} />;
      case 'critical':
        return <AlertCircle size={18} />;
      default:
        return <Eye size={18} />;
    }
  };

  // Get severity badge class
  const getSeverityClass = (severity) => {
    return `severity-badge severity-${severity}`;
  };

  if (loading) {
    return (
      <div className="proctoring-logs-viewer">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading proctoring logs...</p>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="proctoring-logs-viewer">
        <div className="empty-state">
          <Eye size={48} />
          <h3>No Proctoring Logs</h3>
          <p>No monitoring data available for this submission</p>
        </div>
      </div>
    );
  }

  return (
    <div className="proctoring-logs-viewer">
      {/* Statistics Dashboard */}
      <div className="logs-stats">
        <div className="stat-card total">
          <TrendingUp size={24} />
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Events</div>
          </div>
        </div>
        
        <div className="stat-card info">
          <Info size={24} />
          <div className="stat-content">
            <div className="stat-value">{stats.info}</div>
            <div className="stat-label">Info</div>
          </div>
        </div>
        
        <div className="stat-card warning">
          <AlertTriangle size={24} />
          <div className="stat-content">
            <div className="stat-value">{stats.warning}</div>
            <div className="stat-label">Warnings</div>
          </div>
        </div>
        
        <div className="stat-card critical">
          <AlertCircle size={24} />
          <div className="stat-content">
            <div className="stat-value">{stats.critical}</div>
            <div className="stat-label">Critical</div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="logs-filter">
        <Filter size={18} />
        <span>Filter by severity:</span>
        <div className="filter-buttons">
          <button
            className={selectedSeverity === 'all' ? 'active' : ''}
            onClick={() => setSelectedSeverity('all')}
          >
            All ({stats.total})
          </button>
          <button
            className={selectedSeverity === 'info' ? 'active' : ''}
            onClick={() => setSelectedSeverity('info')}
          >
            Info ({stats.info})
          </button>
          <button
            className={selectedSeverity === 'warning' ? 'active' : ''}
            onClick={() => setSelectedSeverity('warning')}
          >
            Warning ({stats.warning})
          </button>
          <button
            className={selectedSeverity === 'critical' ? 'active' : ''}
            onClick={() => setSelectedSeverity('critical')}
          >
            Critical ({stats.critical})
          </button>
        </div>
      </div>

      {/* Logs Timeline */}
      <div className="logs-timeline">
        <h3>Event Timeline</h3>
        
        {filteredLogs.length === 0 ? (
          <div className="no-results">
            <p>No logs match the selected filter</p>
          </div>
        ) : (
          <div className="timeline-list">
            {filteredLogs.map((log) => (
              <div key={log.id} className={`timeline-item ${log.severity}`}>
                <div className="timeline-marker">
                  {getSeverityIcon(log.severity)}
                </div>
                
                <div className="timeline-content">
                  <div className="log-header">
                    <span className={getSeverityClass(log.severity)}>
                      {log.severity.toUpperCase()}
                    </span>
                    <span className="log-timestamp">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                  
                  <div className="log-event-type">
                    {log.event_type.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  
                  <div className="log-message">{log.message}</div>
                  
                  {log.confidence_score !== null && (
                    <div className="log-confidence">
                      Confidence: {(log.confidence_score * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProctoringLogsViewer;
