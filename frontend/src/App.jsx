import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GroupDetails from './pages/GroupDetails';
import RecentActivity from './pages/RecentActivity';
import Profile from './pages/Profile';
import Home from './pages/Home';
import './App.css';

import Layout from './components/Layout';

const PrivateRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Loading...</div>;
  return user ? <Layout /> : <Navigate to="/login" />;
};

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/activity" element={<RecentActivity />} />
          <Route path="/groups/:groupId" element={<GroupDetails />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
