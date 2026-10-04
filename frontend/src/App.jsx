import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/students/StudentList';
import StudentForm from './pages/students/StudentForm';
import ApplicationList from './pages/applications/ApplicationList';
import ApplicationForm from './pages/applications/ApplicationForm';
import ApplicationDetail from './pages/applications/ApplicationDetail';
import MetricsDashboard from './pages/metrics/MetricsDashboard';
import SystemHealth from './pages/health/SystemHealth';
import { ToastProvider } from './context/ToastContext';
import './App.css';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="students" element={<StudentList />} />
            <Route path="students/new" element={<StudentForm />} />
            <Route path="students/:id" element={<StudentForm />} />
            <Route path="applications" element={<ApplicationList />} />
            <Route path="applications/new" element={<ApplicationForm />} />
            <Route path="applications/:id" element={<ApplicationDetail />} />
            <Route path="metrics" element={<MetricsDashboard />} />
            <Route path="system-health" element={<SystemHealth />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
export default App;
