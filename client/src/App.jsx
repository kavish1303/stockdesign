import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Gallery from './pages/Gallery';
import DesignDetail from './pages/DesignDetail';
import MyOrders from './pages/MyOrders';
import Dashboard from './pages/admin/Dashboard';
import ManageDesigns from './pages/admin/ManageDesigns';
import ManageOrders from './pages/admin/ManageOrders';
import ManageUsers from './pages/admin/ManageUsers';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/gallery" element={
            <ProtectedRoute><Gallery /></ProtectedRoute>
          } />
          <Route path="/design/:id" element={
            <ProtectedRoute><DesignDetail /></ProtectedRoute>
          } />
          <Route path="/my-orders" element={
            <ProtectedRoute><MyOrders /></ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>
          } />
          <Route path="/admin/designs" element={
            <ProtectedRoute adminOnly><ManageDesigns /></ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute adminOnly><ManageOrders /></ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute adminOnly><ManageUsers /></ProtectedRoute>
          } />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
