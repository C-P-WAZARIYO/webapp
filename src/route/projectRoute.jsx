import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 

// navigation Pages

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// auth Page 

import Auth from "../auth/Auth";

// authorized Page

import Analytic from "../pages/Analytic";
import AdminPage from "../pages/Admin";
import ManagerPage from "../pages/Manager";
import EmployeePage from "../pages/Employee";
import Allocate from "../pages/Allocate";
import Supervisor from "../pages/Supervisor";
import Task from "../pages/Task";
import Dashboard from "../pages/Dashboard";

// app pages

import Home from "../pages/Home";
// import User from "../pages/User";
import BlogPage from "../pages/BlogFeed";
// import Content from "../pages/Content";
import Profile from "../pages/Profile";
import Features from "../pages/Features";

// connectivity pages

import Chat from "../pages/Chat";
// import VideoCall from "../pages/Videocall";
// import VoiceCall from "../pages/Voicecall";
import Email from "../pages/Email";
import BlogFeed from "../pages/BlogFeed";
import MyBlogs from "../pages/MyBlog";

function ProjectRoute() {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading Finance Portal...</div>;

    return (
        <>
            {/* <Navbar /> */}
            <Routes>
                {/* Public Pages: Everyone can see these */}
                <Route path="/" element={<Home />} />
                <Route path="/blog" element={<BlogFeed />} />
                <Route path="/features" element={<Features />} />
                <Route
  path="/auth/login"
  element={!user ? <Auth /> : <Navigate to="/analytic" />}
/>

<Route
  path="/auth/signup"
  element={!user ? <Auth /> : <Navigate to="/auth/login" />}
/>


                {/* Protected Pages: Redirect to /Auth if no user is logged in */}
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/manager" element={user ? <ManagerPage /> : <Navigate to="/Auth" />} />
                <Route path="/employee" element={<EmployeePage /> } />
                <Route path="/supervisor" element={user ? <Supervisor /> : <Navigate to="/Auth" />} />
                <Route path="/dashboard" element={<Dashboard />}/>
                <Route path="/blog/my-blogs" element={<MyBlogs /> } />
                
                {/* Finance Specific Pages */}
                <Route path="/allocate" element={<Allocate />}/>
                <Route path="/analytic" element={user ? <Analytic /> : <Navigate to="/Auth" />} />
                <Route path="/task" element={user ? <Task /> : <Navigate to="/Auth" />} />
                
                {/* User Settings & Communication */}
                <Route path="/profile" element={user ? <Profile /> : <Navigate to="/Auth" />} />
                <Route path="/chat" element={user ? <Chat /> : <Navigate to="/Auth" />} />
                <Route path="/email" element={user ? <Email /> : <Navigate to="/Auth" />} />
            </Routes>
            <Footer />
        </>
    );
}

export default ProjectRoute;