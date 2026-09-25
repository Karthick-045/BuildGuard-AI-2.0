import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { NewProject } from './pages/NewProject';
import { ProjectWorkspace } from './pages/ProjectWorkspace';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="flex bg-slate-950 text-slate-100 min-h-screen font-sans antialiased">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects/new" element={<NewProject />} />
            <Route path="/projects/:projectId" element={<ProjectWorkspace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
