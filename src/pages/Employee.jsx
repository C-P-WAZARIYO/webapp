import React, { useState, useEffect } from 'react';
import "../styles/Admin.css"; 
import "../styles/Employee.css"; 

const Employee = () => {
    // 1. STATE MANAGEMENT
    const [photo, setPhoto] = useState(null);
    const [metaData, setMetaData] = useState({ location: '', time: '' });
    const [feedback, setFeedback] = useState({
        accId: '', code: '', whoMet: '', metName: '', relation: '',
        place: '', customPlace: '', distance: '', assetAvailable: 'yes',
        assetLocation: '', assetStatus: '', nextActionDate: '', fullFeedback: ''
    });

    const codes = ["Paid", "PTP", "RTP", "Not Available", "Third Person (family)", "Third Person (other)", "ANF"];
    const relations = ["Customer", "Husband", "Wife", "Father", "Mother", "Brother", "Sister", "Cousin", "Mother-in-law", "Father-in-law", "Neighbour", "Landlord", "Office Person", "Sister-in-law", "Brother-in-law", "Friend", "Son", "Daughter", "Someone else"];

    // 2. CAMERA & GPS LOGIC (Strict Environment Mode)
    const handleCapturePhoto = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(URL.createObjectURL(file));
            const now = new Date().toLocaleString();
            
            // Attempt real GPS capture
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    setMetaData({
                        time: now,
                        location: `LAT: ${pos.coords.latitude.toFixed(4)} | LON: ${pos.coords.longitude.toFixed(4)}`
                    });
                }, () => {
                    setMetaData({ time: now, location: "GPS Access Denied" });
                });
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFeedback(prev => ({ ...prev, [name]: value }));
    };

    // 3. STRICT VALIDATION LOGIC
    const isReadyToSubmit = () => {
        const base = feedback.accId && feedback.code && feedback.whoMet && feedback.place && feedback.fullFeedback && photo;
        const metReq = feedback.whoMet === "Customer" || (feedback.metName && (feedback.whoMet !== "Someone else" || feedback.relation));
        const placeReq = feedback.place !== "Anywhere else" || (feedback.customPlace && feedback.distance);
        const assetReq = feedback.assetAvailable === "yes" || (feedback.assetLocation && feedback.assetStatus);
        const dateReq = feedback.code === "Paid" || feedback.nextActionDate;
        
        return base && metReq && placeReq && assetReq && dateReq;
    };

    return (
    <div className="admin-root employee-view">
        <div className="admin-container">

            <header className="admin-header">
                <div className="fun-header-text">
                    <h1 className="text-white">Field Pro 🛰️</h1>
                    <p className="text-slate-400">Secure Evidence-Based Reporting</p>
                </div>
            </header>

            <div className="employee-grid">

                {/* TASK LIST SECTION */}
                <aside className="allocation-section">
                    <div className="group-card-container shadow-2xl">
                        <h2 className="section-title">📥 My Tasks</h2>
                        <div className="task-list">
                            {[1, 2].map(id => (
                                <div key={id} className="task-card">
                                    <div className="task-info">
                                        <span className="task-name">Batch_Assignment_{id}</span>
                                        <span className="task-status">Ready for Download</span>
                                    </div>
                                    <button className="dl-icon-btn">⬇️</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* FORM SECTION */}
                <main className="feedback-section">
                    <div className="feedback-form-card shadow-2xl">
                        <h2 className="section-title border-b border-slate-800 pb-4">
                            New Visit Entry
                        </h2>

                        <form className="employee-form" onSubmit={(e) => e.preventDefault()}>

                            {/* CAMERA INPUT */}
                            <div className="photo-upload-zone">
                                <label className="input-label">
                                    Live Site Photo (Required) *
                                </label>

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

                            {/* ACCOUNT + CODE */}
                            <div className="field-group">
                                <div className="input-box">
                                    <label className="input-label">Account ID *</label>
                                    <input
                                        type="text"
                                        name="accId"
                                        className="emp-input"
                                        placeholder="ID Number"
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="input-box">
                                    <label className="input-label">Visit Code *</label>
                                    <select
                                        name="code"
                                        className="emp-select"
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

                            {/* WHO MET */}
                            <div className="field-group">
                                <div className="input-box">
                                    <label className="input-label">Who Met? *</label>
                                    <select
                                        name="whoMet"
                                        className="emp-select"
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
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            )}

                            {/* PLACE */}
                            <div className="field-group">
                                <div className="input-box">
                                    <label className="input-label">Meeting Place *</label>
                                    <select
                                        name="place"
                                        className="emp-select"
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
                                        <label className="input-label">Distance *</label>
                                        <input
                                            type="text"
                                            name="distance"
                                            className="emp-input"
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
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            )}

                            {/* ASSET */}
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
                                            onChange={handleInputChange}
                                            required
                                        />
                                        <select
                                            name="assetStatus"
                                            className="emp-select"
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

                            {feedback.code !== "Paid" && (
                                <div className="input-box full-width">
                                    <label className="input-label">Next Action Date *</label>
                                    <input
                                        type="date"
                                        name="nextActionDate"
                                        className="emp-input"
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            )}

                            <div className="input-box full-width">
                                <label className="input-label">Visit Observations *</label>
                                <textarea
                                    name="fullFeedback"
                                    className="emp-area"
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="submit-heavy-btn"
                                disabled={!isReadyToSubmit()}
                            >
                                {isReadyToSubmit()
                                    ? "Push Data to Base ✨"
                                    : "Awaiting All Details..."}
                            </button>

                        </form>
                    </div>
                </main>
            </div>
        </div>
    </div>
);

};


export default Employee;