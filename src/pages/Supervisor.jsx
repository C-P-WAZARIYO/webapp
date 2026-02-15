import "../styles/Supervisor.css";
import React, { useState, useEffect } from 'react';

function Supervisor() {

    const [user] = useState({
        name: "Aditya Singh",
        role: "SUPERVISOR",
        lastLogin: "Feb 10, 2026 - 09:30 AM",
        targetProgress: 40,
        status: "On Track",
        trend: "up" // up, Down, Stable
    })
    const [greeting, setGreeting] = useState("");

    useEffect(()=>{
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 18) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");
    }, []);

    const canUpload = ["ADMIN", "SUPERVISOR"].includes(user.role);

    return (
        <>
            <div className="supervisor-dashboard">
                {/* {Welcome section} */}
                <header className="supervisor-header">
                    <div className="welcome-meta">
                    <h1 classname="greating-text">{greeting}, {user.name}</h1>
                    <div className="supervisor-badge">
                        <span className="role-lable">{user.role}</span>
                        <span className="divider">|</span>
                        <span className="last-login">Last Login: {user.lastLogin}</span>
                    </div>
                    </div>

                    {canUpload && (
                        <div className="action-area">
                            <button className="cta-button">Upload Data</button>
                        </div>
                    )}
                </header>
                
            </div>
        </>
    )

}

export default Supervisor;