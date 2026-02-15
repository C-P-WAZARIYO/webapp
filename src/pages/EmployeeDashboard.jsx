import React, { useState, useEffect, useContext, useCallback } from 'react';
import "../styles/EmployeeDashboard.css";
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const EmployeeDashboard = () => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('overview');
    const [profile, setProfile] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [cases, setCases] = useState([]);
    const [todayTasks, setTodayTasks] = useState([]);
    const [ptpAlerts, setPtpAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notificationCount, setNotificationCount] = useState(0);
    const [selectedCase, setSelectedCase] = useState(null);
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);

    // Performance filters
    const [perfFilter, setPerfFilter] = useState({
        timeframe: 'month', // month, quarter, year
        groupBy: 'overall', // overall, bankwise, productwise, bktwise
        viewType: 'count' // count, poswise
    });

    // Fetch user profile and performance data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [profileRes, perfRes, casesRes] = await Promise.all([
                    api.get(`/users/${user?.id}`),
                    api.get(`/users/${user?.id}/performance-metrics`),
                    api.get(`/cases/assigned/${user?.id}`)
                ]);

                setProfile(profileRes.data?.data?.user);
                setPerformance(perfRes.data?.data?.metrics);
                setCases(casesRes.data?.data?.cases || []);

                // Filter today's tasks (cases with next action today)
                filterTodaysTasks(casesRes.data?.data?.cases || []);
                
                // Check for PTP alerts
                fetchPTPAlerts();

                // Set up notification checker
                setupNotificationChecker();
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchDashboardData();
            // Refresh every 5 minutes
            const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [user?.id]);

    // Filter cases with next action due today
    const filterTodaysTasks = (caseList) => {
        const today = new Date().toDateString();
        const todayTasks = caseList.filter(caseData => {
            if (caseData.feedbacks?.length > 0) {
                const lastFeedback = caseData.feedbacks[caseData.feedbacks.length - 1];
                if (lastFeedback?.ptp_date) {
                    const ptpDate = new Date(lastFeedback.ptp_date).toDateString();
                    return ptpDate === today && !lastFeedback?.ptp_broken;
                }
            }
            return false;
        });
        setTodayTasks(todayTasks);
    };

    // Fetch PTP alerts
    const fetchPTPAlerts = async () => {
        try {
            const res = await api.get('/feedbacks/alerts/ptp');
            setPtpAlerts(res.data?.data?.alerts || []);
            setNotificationCount(res.data?.data?.alerts?.length || 0);
        } catch (error) {
            console.error('Error fetching PTP alerts:', error);
        }
    };

    // Setup notification checker - every 3 hours until 7 PM
    const setupNotificationChecker = useCallback(() => {
        const checkNotifications = () => {
            const now = new Date();
            const hours = now.getHours();

            // Check between 9 AM and 7 PM
            if (hours >= 9 && hours < 19) {
                // Check PTP alerts and show browser notification
                ptpAlerts.forEach(alert => {
                    if (hours % 3 === 0 && minutes === 0) {
                        sendNotification(alert);
                    }
                });
            }
        };

        // Check every minute
        const interval = setInterval(checkNotifications, 60000);
        return () => clearInterval(interval);
    }, [ptpAlerts]);

    // Send browser notification
    const sendNotification = (alert) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Action Required', {
                body: `Account ${alert.case?.acc_id} needs update. PTP: ${alert.feedback?.ptp_date}`,
                icon: '🔔'
            });
        }
    };

    // Download today's important cases
    const downloadTodaysCases = () => {
        const casesData = todayTasks.map(caseData => ({
            'Account ID': caseData.acc_id,
            'Customer Name': caseData.customer_name,
            'Phone': caseData.phone_number,
            'POS Amount': caseData.pos_amount,
            'Bucket': caseData.bkt,
            'Product': caseData.product_type,
            'Bank': caseData.bank_name,
            'Address': caseData.address,
            'Last Feedback': caseData.feedbacks?.[0]?.remarks || 'No feedback'
        }));

        // Convert to CSV
        const csv = [
            Object.keys(casesData[0]),
            ...casesData.map(c => Object.values(c).map(v => `"${v}"`).join(','))
        ].join('\n');

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `today-cases-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Download visit plan based on PTP dates
    const downloadVisitPlan = () => {
        const nextSevenDays = new Date();
        nextSevenDays.setDate(nextSevenDays.getDate() + 7);

        const planData = cases
            .filter(caseData => {
                if (caseData.feedbacks?.length > 0) {
                    const lastFeedback = caseData.feedbacks[caseData.feedbacks.length - 1];
                    if (lastFeedback?.ptp_date) {
                        const ptpDate = new Date(lastFeedback.ptp_date);
                        return ptpDate <= nextSevenDays && !lastFeedback?.ptp_broken;
                    }
                }
                return false;
            })
            .map(caseData => {
                const lastFeedback = caseData.feedbacks?.[caseData.feedbacks.length - 1];
                return {
                    'Account ID': caseData.acc_id,
                    'Customer Name': caseData.customer_name,
                    'Next Action Date': lastFeedback?.ptp_date ? new Date(lastFeedback.ptp_date).toLocaleDateString() : 'N/A',
                    'Priority': caseData.priority,
                    'Address': caseData.address,
                    'Phone': caseData.phone_number,
                    'POS Amount': caseData.pos_amount
                };
            });

        // Convert to CSV
        if (planData.length === 0) {
            alert('No visit plan for next 7 days');
            return;
        }

        const csv = [
            Object.keys(planData[0]),
            ...planData.map(c => Object.values(c).map(v => `"${v}"`).join(','))
        ].join('\n');

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visit-plan-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) {
        return <div className="dashboard-loading">Loading your dashboard...</div>;
    }

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>📊 Employee Dashboard</h1>
                    <p>Welcome, {profile?.firstName} {profile?.lastName}</p>
                </div>
                <div className="header-actions">
                    <button 
                        className="notification-btn"
                        onClick={() => {
                            if (Notification.permission !== 'granted') {
                                Notification.requestPermission();
                            }
                        }}
                    >
                        🔔 {notificationCount > 0 && <span className="badge">{notificationCount}</span>}
                    </button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="dashboard-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('performance')}
                >
                    My Performance
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
                    onClick={() => setActiveTab('feedback')}
                >
                    Feedback Form
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    Profile
                </button>
            </div>

            {/* Tab Content */}
            <div className="dashboard-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="tab-pane">
                        {/* Today's Tasks Card */}
                        <div className="card">
                            <div className="card-header">
                                <h2>📋 Today's Priority Cases</h2>
                                <span className="card-count">{todayTasks.length}</span>
                            </div>
                            <div className="card-actions">
                                <button 
                                    className="btn btn-primary"
                                    onClick={downloadTodaysCases}
                                    disabled={todayTasks.length === 0}
                                >
                                    📥 Download Cases
                                </button>
                            </div>
                            <div className="tasks-list">
                                {todayTasks.length === 0 ? (
                                    <p className="empty-state">No cases due today</p>
                                ) : (
                                    todayTasks.map(caseData => (
                                        <div key={caseData.id} className="task-item">
                                            <div className="task-header">
                                                <span className="account-id">{caseData.acc_id}</span>
                                                <span className="customer-name">{caseData.customer_name}</span>
                                            </div>
                                            <div className="task-details">
                                                <span>💰 ₹{caseData.pos_amount}</span>
                                                <span>📦 {caseData.product_type}</span>
                                                <span>🏦 {caseData.bank_name}</span>
                                            </div>
                                            <button 
                                                className="btn btn-sm btn-secondary"
                                                onClick={() => {
                                                    setSelectedCase(caseData);
                                                    setShowFeedbackForm(true);
                                                }}
                                            >
                                                Update Feedback
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* PTP Alerts Card */}
                        <div className="card">
                            <div className="card-header">
                                <h2>⚠️ Action Alerts</h2>
                                <span className="card-count warning">{ptpAlerts.length}</span>
                            </div>
                            <div className="alerts-list">
                                {ptpAlerts.length === 0 ? (
                                    <p className="empty-state">No pending alerts</p>
                                ) : (
                                    ptpAlerts.map((alert, idx) => (
                                        <div key={idx} className="alert-item">
                                            <div className="alert-content">
                                                <span className="alert-case">{alert.case?.acc_id}</span>
                                                <p className="alert-text">
                                                    PTP was {new Date(alert.feedback?.ptp_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className="alert-flag">Overdue</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Download Visit Plan */}
                        <div className="card">
                            <div className="card-header">
                                <h2>📅 Visit Plan</h2>
                            </div>
                            <p className="visit-plan-desc">Next 7 days schedule based on PTP dates</p>
                            <button 
                                className="btn btn-primary btn-wide"
                                onClick={downloadVisitPlan}
                            >
                                📥 Download Visit Plan
                            </button>
                        </div>
                    </div>
                )}

                {/* Performance Tab */}
                {activeTab === 'performance' && (
                    <div className="tab-pane">
                        {/* Performance Filters */}
                        <div className="filter-section">
                            <div className="filter-group">
                                <label>Timeframe:</label>
                                <select 
                                    value={perfFilter.timeframe}
                                    onChange={(e) => setPerfFilter({...perfFilter, timeframe: e.target.value})}
                                >
                                    <option value="month">This Month</option>
                                    <option value="quarter">This Quarter</option>
                                    <option value="year">This Year</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Group By:</label>
                                <select 
                                    value={perfFilter.groupBy}
                                    onChange={(e) => setPerfFilter({...perfFilter, groupBy: e.target.value})}
                                >
                                    <option value="overall">Overall</option>
                                    <option value="bankwise">Bank-wise</option>
                                    <option value="productwise">Product-wise</option>
                                    <option value="bktwise">BKT-wise</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>View Type:</label>
                                <select 
                                    value={perfFilter.viewType}
                                    onChange={(e) => setPerfFilter({...perfFilter, viewType: e.target.value})}
                                >
                                    <option value="count">Count-wise</option>
                                    <option value="poswise">POS-wise (Value)</option>
                                </select>
                            </div>
                        </div>

                        {/* Performance Cards */}
                        <div className="performance-grid">
                            <div className="perf-card">
                                <h3>Total Cases</h3>
                                <p className="perf-value">{performance?.total_cases || 0}</p>
                                <span className="perf-label">Assigned</span>
                            </div>
                            <div className="perf-card">
                                <h3>Visited Cases</h3>
                                <p className="perf-value">{performance?.visited_cases || 0}</p>
                                <span className="perf-label">Completed</span>
                            </div>
                            <div className="perf-card">
                                <h3>Total POS</h3>
                                <p className="perf-value">₹{(performance?.total_pos || 0).toLocaleString()}</p>
                                <span className="perf-label">Outstanding</span>
                            </div>
                            <div className="perf-card success">
                                <h3>Recovered POS</h3>
                                <p className="perf-value">₹{(performance?.recovered_pos || 0).toLocaleString()}</p>
                                <span className="perf-label">Collections</span>
                            </div>
                        </div>

                        {/* Performance By Category */}
                        {perfFilter.groupBy !== 'overall' && (
                            <div className="card">
                                <h3>Performance by {perfFilter.groupBy}</h3>
                                <div className="category-breakdown">
                                    {performance?.breakdown?.map((item, idx) => (
                                        <div key={idx} className="breakdown-row">
                                            <span>{item.category}</span>
                                            <span>{perfFilter.viewType === 'count' ? item.count : `₹${item.pos}`}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Feedback Form Tab */}
                {activeTab === 'feedback' && (
                    <div className="tab-pane">
                        {!showFeedbackForm ? (
                            <div className="card">
                                <h2>📝 Select a Case to Provide Feedback</h2>
                                <div className="cases-selector">
                                    {cases.length === 0 ? (
                                        <p className="empty-state">No cases assigned yet</p>
                                    ) : (
                                        <div className="cases-grid">
                                            {cases.map(caseData => (
                                                <div 
                                                    key={caseData.id} 
                                                    className="case-selector-card"
                                                    onClick={() => {
                                                        setSelectedCase(caseData);
                                                        setShowFeedbackForm(true);
                                                    }}
                                                >
                                                    <div className="selector-header">
                                                        <p className="selector-id">{caseData.acc_id}</p>
                                                        <p className="selector-name">{caseData.customer_name}</p>
                                                    </div>
                                                    <p className="selector-amount">₹{caseData.pos_amount}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <FeedbackForm 
                                caseData={selectedCase}
                                onClose={() => {
                                    setShowFeedbackForm(false);
                                    setSelectedCase(null);
                                }}
                                onSubmit={() => {
                                    setShowFeedbackForm(false);
                                    setActiveTab('overview');
                                    // Refresh data
                                    window.location.reload();
                                }}
                            />
                        )}
                    </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="tab-pane">
                        <div className="card">
                            <h2>👤 Your Profile</h2>
                            <div className="profile-content">
                                <div className="profile-field">
                                    <label>First Name</label>
                                    <p>{profile?.firstName}</p>
                                </div>
                                <div className="profile-field">
                                    <label>Last Name</label>
                                    <p>{profile?.lastName}</p>
                                </div>
                                <div className="profile-field">
                                    <label>Email</label>
                                    <p>{profile?.email}</p>
                                </div>
                                <div className="profile-field">
                                    <label>Phone</label>
                                    <p>{profile?.phone}</p>
                                </div>
                                <div className="profile-field">
                                    <label>Employee ID</label>
                                    <p>{profile?.emp_id || 'N/A'}</p>
                                </div>
                                <div className="profile-field">
                                    <label>Total Cases Assigned</label>
                                    <p>{cases?.length || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Feedback Form Modal */}
            {showFeedbackForm && selectedCase && (
                <div className="modal-overlay" onClick={() => setShowFeedbackForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className="modal-close"
                            onClick={() => setShowFeedbackForm(false)}
                        >
                            ✕
                        </button>
                        <FeedbackForm 
                            caseData={selectedCase}
                            onClose={() => setShowFeedbackForm(false)}
                            onSubmit={() => {
                                setShowFeedbackForm(false);
                                setActiveTab('overview');
                                window.location.reload();
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// Feedback Form Component
const FeedbackForm = ({ caseData, onClose, onSubmit }) => {
    const [photo, setPhoto] = useState(null);
    const [metaData, setMetaData] = useState({ location: '', time: '' });
    const [feedback, setFeedback] = useState({
        code: '',
        whoMet: '',
        metName: '',
        relation: '',
        place: '',
        customPlace: '',
        distance: '',
        assetAvailable: 'yes',
        assetLocation: '',
        assetStatus: '',
        nextActionDate: '',
        fullFeedback: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const codes = ["Paid", "PTP", "RTP", "Not Available", "Third Person (family)", "Third Person (other)", "ANF"];
    const relations = ["Customer", "Husband", "Wife", "Father", "Mother", "Brother", "Sister", "Cousin", "Mother-in-law", "Father-in-law", "Neighbour", "Landlord", "Office Person", "Sister-in-law", "Brother-in-law", "Friend", "Son", "Daughter", "Someone else"];

    const handleCapturePhoto = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(URL.createObjectURL(file));
            const now = new Date().toLocaleString();
            
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setMetaData({
                            time: now,
                            location: `LAT: ${pos.coords.latitude.toFixed(4)} | LON: ${pos.coords.longitude.toFixed(4)}`
                        });
                    },
                    () => {
                        setMetaData({ time: now, location: "GPS Access Denied" });
                    }
                );
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFeedback(prev => ({ ...prev, [name]: value }));
    };

    const isReadyToSubmit = () => {
        const base = feedback.code && feedback.whoMet && feedback.place && feedback.fullFeedback && photo;
        const metReq = feedback.whoMet === "Customer" || (feedback.metName && (feedback.whoMet !== "Someone else" || feedback.relation));
        const placeReq = feedback.place !== "Anywhere else" || (feedback.customPlace && feedback.distance);
        const assetReq = feedback.assetAvailable === "yes" || (feedback.assetLocation && feedback.assetStatus);
        const dateReq = feedback.code === "Paid" || feedback.nextActionDate;
        
        return base && metReq && placeReq && assetReq && dateReq;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isReadyToSubmit()) return;

        try {
            setSubmitting(true);
            
            // Create form data for file upload
            const formData = new FormData();
            formData.append('caseId', caseData.id);
            formData.append('visit_code', feedback.code);
            formData.append('meeting_place', feedback.place);
            formData.append('asset_status', feedback.assetStatus || 'N/A');
            formData.append('remarks', feedback.fullFeedback);
            formData.append('ptp_date', feedback.nextActionDate || null);
            formData.append('photo', photo); // Assuming photo is a file

            // Get GPS coordinates from metaData
            const coordMatch = metaData.location?.match(/LAT: ([\d.-]+) \| LON: ([\d.-]+)/);
            if (coordMatch) {
                formData.append('lat', coordMatch[1]);
                formData.append('lng', coordMatch[2]);
            }

            await api.post('/feedbacks', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert('Feedback submitted successfully!');
            onSubmit();
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Error submitting feedback: ' + error.response?.data?.message || error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="feedback-form">
            <h2>Feedback for {caseData.acc_id}</h2>
            <p className="case-info">{caseData.customer_name} | ₹{caseData.pos_amount}</p>

            <form onSubmit={handleSubmit}>
                {/* Photo Section */}
                <div className="photo-upload-zone">
                    <label className="input-label">Live Site Photo (Required) *</label>
                    <div className={`camera-box ${!photo ? 'pending' : 'captured'}`}>
                        {photo ? (
                            <div className="photo-wrap">
                                <img src={photo} alt="Preview" className="captured-img" />
                                <div className="meta-info">
                                    <span>📍 {metaData.location}</span>
                                    <span>⏰ {metaData.time}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPhoto(null)}
                                    className="clear-photo"
                                >
                                    Retake
                                </button>
                            </div>
                        ) : (
                            <label className="camera-ui">
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleCapturePhoto}
                                    required
                                />
                                <div className="camera-plus">📸</div>
                                <p>Tap to Snap Evidence</p>
                            </label>
                        )}
                    </div>
                </div>

                {/* Visit Code */}
                <div className="field-group">
                    <div className="input-box">
                        <label className="input-label">Visit Code *</label>
                        <select
                            name="code"
                            className="emp-select"
                            value={feedback.code}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">-- Select --</option>
                            {codes.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Who Met */}
                <div className="field-group">
                    <div className="input-box">
                        <label className="input-label">Who Met? *</label>
                        <select
                            name="whoMet"
                            className="emp-select"
                            value={feedback.whoMet}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">-- Select --</option>
                            {relations.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    {feedback.whoMet && feedback.whoMet !== "Customer" && (
                        <div className="input-box">
                            <label className="input-label">Person Name *</label>
                            <input
                                type="text"
                                name="metName"
                                className="emp-input"
                                placeholder="Enter Name"
                                value={feedback.metName}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    )}
                </div>

                {feedback.whoMet === "Someone else" && (
                    <div className="input-box full-width">
                        <label className="input-label">Relationship Description *</label>
                        <input
                            type="text"
                            name="relation"
                            className="emp-input"
                            placeholder="Describe relation"
                            value={feedback.relation}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                )}

                {/* Place */}
                <div className="field-group">
                    <div className="input-box">
                        <label className="input-label">Meeting Place *</label>
                        <select
                            name="place"
                            className="emp-select"
                            value={feedback.place}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">-- Select --</option>
                            <option value="Home">Home</option>
                            <option value="Office">Office</option>
                            <option value="Farm">Farm</option>
                            <option value="Anywhere else">Anywhere else</option>
                        </select>
                    </div>

                    {feedback.place === "Anywhere else" && (
                        <div className="input-box">
                            <label className="input-label">Distance (Km) *</label>
                            <input
                                type="text"
                                name="distance"
                                className="emp-input"
                                value={feedback.distance}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    )}
                </div>

                {feedback.place === "Anywhere else" && (
                    <div className="input-box full-width">
                        <label className="input-label">Specify Location *</label>
                        <input
                            type="text"
                            name="customPlace"
                            className="emp-input"
                            value={feedback.customPlace}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                )}

                {/* Asset */}
                <div className="asset-card">
                    <label className="input-label">Asset Status *</label>
                    <div className="radio-flex">
                        <label className="radio-btn">
                            <input
                                type="radio"
                                name="assetAvailable"
                                value="yes"
                                checked={feedback.assetAvailable === 'yes'}
                                onChange={handleInputChange}
                            />
                            <span>Yes</span>
                        </label>
                        <label className="radio-btn">
                            <input
                                type="radio"
                                name="assetAvailable"
                                value="no"
                                checked={feedback.assetAvailable === 'no'}
                                onChange={handleInputChange}
                            />
                            <span>No</span>
                        </label>
                    </div>

                    {feedback.assetAvailable === 'no' && (
                        <div className="nested-fields">
                            <input
                                type="text"
                                name="assetLocation"
                                className="emp-input"
                                placeholder="Current location"
                                value={feedback.assetLocation}
                                onChange={handleInputChange}
                                required
                            />
                            <select
                                name="assetStatus"
                                className="emp-select"
                                value={feedback.assetStatus}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Reason...</option>
                                <option value="Sold">Sold</option>
                                <option value="Stolen">Stolen</option>
                                <option value="Pledged">Pledged</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Next Action Date */}
                {feedback.code !== "Paid" && (
                    <div className="input-box full-width">
                        <label className="input-label">Next Action Date *</label>
                        <input
                            type="date"
                            name="nextActionDate"
                            className="emp-input"
                            value={feedback.nextActionDate}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                )}

                {/* Feedback Text */}
                <div className="input-box full-width">
                    <label className="input-label">Visit Observations *</label>
                    <textarea
                        name="fullFeedback"
                        className="emp-area"
                        placeholder="Describe your visit observations, customer response, etc."
                        value={feedback.fullFeedback}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                {/* Buttons */}
                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!isReadyToSubmit() || submitting}
                    >
                        {submitting ? 'Submitting...' : 'Push Data to Base ✨'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EmployeeDashboard;
