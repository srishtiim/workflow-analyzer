import React, { useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend } from 'recharts';
import { Upload, LayoutDashboard, AlertTriangle, List, CheckCircle, AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import CountUp from 'react-countup';
import { motion, AnimatePresence } from 'framer-motion';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '8px 12px', fontSize: '12px', borderRadius: '4px' }}>
        <p style={{ fontWeight: 500, margin: '0 0 4px 0' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, margin: '2px 0' }}>{entry.name}: {entry.value?.toFixed ? entry.value.toFixed(2) : entry.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const handleUploadClick = () => {
    document.getElementById('csv-upload').click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const runAnalysis = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post('http://https://workflow-analyzer-backend.onrender.comlocalhost:8000/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setData(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-title">
            <div style={{ width: 20, height: 20, background: 'var(--text-primary)', borderRadius: 2 }} />
            Workflow Analyzer
          </div>
          <nav>
            <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              <LayoutDashboard size={16} /> Overview
            </button>
            <button className={`nav-item ${activeTab === 'bottlenecks' ? 'active' : ''}`} onClick={() => setActiveTab('bottlenecks')}>
              <AlertTriangle size={16} /> Bottlenecks
            </button>
            <button className={`nav-item ${activeTab === 'workflows' ? 'active' : ''}`} onClick={() => setActiveTab('workflows')}>
              <List size={16} /> Workflows
            </button>
          </nav>
        </div>
        <div className="sidebar-bottom">
          <div className="status-dot" />
          Model Ready
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {loading && (
          <div className="loading-bar-container">
            <motion.div 
              className="loading-bar"
              animate={{ width: ["0%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        )}
        
        <div className="topbar">
          <h2 className="topbar-title">{activeTab}</h2>
          <div className="topbar-date">
             {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>

        <div className="content-area">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'overview' && (
                <div>
                  <div className={`upload-zone ${file ? 'has-file' : ''}`} onClick={handleUploadClick}>
                    <input type="file" id="csv-upload" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />
                    {file ? (
                      <>
                        <CheckCircle className="upload-icon" style={{ color: 'var(--green)' }} size={24} />
                        <p className="upload-text">{file.name}</p>
                      </>
                    ) : (
                      <>
                        <Upload className="upload-icon" size={24} />
                        <p className="upload-text">Drop your workflow CSV here</p>
                        <p className="upload-subtext">or click to browse</p>
                      </>
                    )}
                  </div>
                  {file && (
                    <div className="run-btn-container">
                      <button className="run-btn" onClick={runAnalysis} disabled={loading}>
                        {loading ? "Running..." : "Run Analysis"}
                      </button>
                    </div>
                  )}

                  {!data ? (
                     <div className="empty-state">
                        <div className="empty-icon-box">
                          <List size={20} style={{ opacity: 0.2 }} />
                        </div>
                        <p className="upload-text" style={{ color: 'var(--text-muted)' }}>Upload a CSV to get started</p>
                     </div>
                  ) : (
                    <>
                      <div className="stats-grid">
                        <div className="stat-card">
                          <p className="stat-label">Total Workflows</p>
                          <p className="stat-value"><CountUp end={data.total_workflows} duration={0.8} /></p>
                        </div>
                        <div className="stat-card">
                          <p className="stat-label">Delayed Tasks</p>
                          <p className="stat-value val-red"><CountUp end={data.total_delayed} duration={0.8} /></p>
                        </div>
                        <div className="stat-card">
                          <p className="stat-label">On-Time Tasks</p>
                          <p className="stat-value val-green"><CountUp end={data.total_ontime} duration={0.8} /></p>
                        </div>
                        <div className="stat-card">
                          <p className="stat-label">Delay Rate %</p>
                          <p className="stat-value"><CountUp end={Math.round(data.delay_rate * 10) / 10} duration={0.8} decimals={1} />%</p>
                        </div>
                      </div>

                      <div className="charts-grid">
                        <div className="chart-card">
                          <h3 className="chart-title">Inefficiency by department</h3>
                          <div className="chart-container">
                            <ResponsiveContainer width="100%" height={280}>
                              <BarChart data={data.dept_inefficiency} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
                                <Bar dataKey="avg_inefficiency_score" name="Avg Inefficiency" fill="var(--text-primary)" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="chart-card">
                          <h3 className="chart-title">Actual vs expected duration</h3>
                          <div className="chart-container">
                            <ResponsiveContainer width="100%" height={280}>
                              <BarChart data={data.dept_duration} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                <Bar dataKey="avg_actual" name="Actual" fill="var(--text-primary)" />
                                <Bar dataKey="avg_expected" name="Expected" fill="var(--border)" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'bottlenecks' && (
                <div>
                  {!data ? (
                     <div className="empty-state">
                        <p className="upload-text" style={{ color: 'var(--text-muted)' }}>No data available. Please run analysis on Overview page.</p>
                     </div>
                  ) : (
                    <>
                      <h2 className="page-heading">Top bottleneck departments</h2>
                      <div>
                        {data.bottlenecks.map((dept, idx) => {
                          const maxScore = data.dept_inefficiency.reduce((max, d) => Math.max(max, d.avg_inefficiency_score), 0);
                          const rankClass = `bn-rank-${idx + 1}`;
                          const textClass = idx === 0 ? 'bn-text-red' : idx === 1 ? 'bn-text-orange' : 'bn-text-yellow';
                          const bgClass = idx === 0 ? 'bn-bg-red' : idx === 1 ? 'bn-bg-orange' : 'bn-bg-yellow';
                          
                          return (
                            <div key={idx} className={`bottleneck-card ${rankClass}`}>
                              <div className="bn-header">
                                <span className="bn-dept">{dept.department}</span>
                                <span className={`bn-score ${textClass}`}>{dept.inefficiency_score.toFixed(2)}</span>
                              </div>
                              <div className="progress-track">
                                <div className={`progress-fill ${bgClass}`} style={{ width: `${(dept.inefficiency_score / maxScore) * 100}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <h2 className="page-heading" style={{ marginTop: 32 }}>Department severity breakdown</h2>
                      <div className="chart-card">
                        <div className="chart-container">
                          <ResponsiveContainer width="100%" height={280}>
                            <BarChart layout="vertical" data={[...data.dept_inefficiency].sort((a,b)=>b.avg_inefficiency_score - a.avg_inefficiency_score)} margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                              <YAxis type="category" dataKey="department" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-primary)' }} dx={-10} />
                              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
                              <Bar dataKey="avg_inefficiency_score" name="Inefficiency Score" barSize={24} radius={[0, 4, 4, 0]}>
                                {[...data.dept_inefficiency].sort((a,b)=>b.avg_inefficiency_score - a.avg_inefficiency_score).map((entry, index) => {
                                  let color = 'var(--green)';
                                  if (entry.avg_inefficiency_score > 1.5) color = 'var(--red)';
                                  else if (entry.avg_inefficiency_score > 0.8) color = 'var(--orange)';
                                  return <Cell key={`cell-${index}`} fill={color} />;
                                })}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'workflows' && (
                <div>
                  {!data ? (
                     <div className="empty-state">
                        <p className="upload-text" style={{ color: 'var(--text-muted)' }}>No data available. Please run analysis on Overview page.</p>
                     </div>
                  ) : (() => {
                    const filtered = data.workflows.filter(w => {
                      const taskIdMatch = w.task_id?.toString().toLowerCase().includes(searchQuery.toLowerCase());
                      const deptMatch = w.department?.toString().toLowerCase().includes(searchQuery.toLowerCase());
                      return taskIdMatch || deptMatch;
                    });
                    const totalPages = Math.ceil(filtered.length / rowsPerPage);
                    const pages = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

                    return (
                      <div className="table-container">
                        <div className="table-header">
                          <Search size={16} color="var(--text-muted)" />
                          <input 
                            type="text" 
                            placeholder="Search by Task ID or Department..." 
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setCurrentPage(1);
                            }}
                          />
                        </div>
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Task ID</th>
                              <th>Workflow Type</th>
                              <th>Department</th>
                              <th>Priority</th>
                              <th>Steps</th>
                              <th>Delay Flag</th>
                              <th>Ineff. Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pages.map((row, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 500 }}>{row.task_id}</td>
                                <td>{row.workflow_type}</td>
                                <td>{row.department}</td>
                                <td>
                                  <span className={`badge ${
                                    row.priority === 'Critical' ? 'badge-critical' :
                                    row.priority === 'High' ? 'badge-high' :
                                    row.priority === 'Medium' ? 'badge-medium' : 'badge-low'
                                  }`}>
                                    {row.priority}
                                  </span>
                                </td>
                                <td>{row.total_steps}</td>
                                <td>
                                  <span className={`badge ${row.delay_flag === 1 ? "badge-delayed" : "badge-ontime"}`}>
                                    {row.delay_flag === 1 ? "Delayed" : "On Time"}
                                  </span>
                                </td>
                                <td className={
                                  row.inefficiency_score > 1.0 ? "score-red" : row.inefficiency_score < 0 ? "score-green" : ""
                                }>
                                  {row.inefficiency_score?.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="pagination">
                          <span className="page-info">
                            Showing {(currentPage - 1) * rowsPerPage + (filtered.length > 0 ? 1 : 0)} to {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}
                          </span>
                          <div className="page-controls">
                            <button 
                              className="page-btn"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <button 
                              className="page-btn"
                              disabled={currentPage === totalPages || totalPages === 0}
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
