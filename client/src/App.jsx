import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Contacts from './pages/Contacts';
import Activities from './pages/Activities';
import Tasks from './pages/Tasks';
import Complaints from './pages/Complaints';
import Contracts from './pages/Contracts';
import AdminUsers from './pages/AdminUsers';
import AdminInstitutions from './pages/AdminInstitutions';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Private Routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout>
                  <Home />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <PrivateRoute>
                <Layout>
                  <Contacts />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/activities"
            element={
              <PrivateRoute>
                <Layout>
                  <Activities />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <PrivateRoute>
                <Layout>
                  <Tasks />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/complaints"
            element={
              <PrivateRoute>
                <Layout>
                  <Complaints />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/contracts"
            element={
              <PrivateRoute>
                <Layout>
                  <Contracts />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/users"
            element={
              <PrivateRoute adminOnly>
                <Layout>
                  <AdminUsers />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/institutions"
            element={
              <PrivateRoute adminOnly>
                <Layout>
                  <AdminInstitutions />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
