import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { NewProject } from './pages/NewProject';
import { ProjectWorkspace } from './pages/ProjectWorkspace';
import { AgentChatbot } from './components/chat/AgentChatbot';
import { projectApi } from './services/api';

const AppContent: React.FC = () => {
  const location = useLocation();
  const [activeProjectId, setActiveProjectId] = useState<number>(1);
  const [activeProjectName, setActiveProjectName] = useState<string>('BuildGuard Demonstration Project');

  useEffect(() => {
    // If route matches /projects/:id, extract ID
    const match = location.pathname.match(/\/projects\/(\d+)/);
    if (match) {
      setActiveProjectId(Number(match[1]));
    } else {
      // Find latest project or fallback to 1
      projectApi.getProjects().then(res => {
        if (res.projects && res.projects.length > 0) {
          setActiveProjectId(res.projects[0].id);
          setActiveProjectName(res.projects[0].name);
        }
      }).catch(() => {});
    }

    const handleProjectChanged = (e: any) => {
      if (e.detail?.projectId) {
        setActiveProjectId(e.detail.projectId);
        if (e.detail?.projectName) {
          setActiveProjectName(e.detail.projectName);
        }
      }
    };

    window.addEventListener('buildguard_project_changed', handleProjectChanged as EventListener);
    return () => {
      window.removeEventListener('buildguard_project_changed', handleProjectChanged as EventListener);
    };
  }, [location.pathname]);

  return (
    <div className="flex bg-slate-950 text-slate-100 min-h-screen font-sans antialiased relative">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects/new" element={<NewProject />} />
          <Route path="/projects/:projectId" element={<ProjectWorkspace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global AI Inspector Chatbot - Always Visible & Accessible on Localhost */}
      <AgentChatbot projectId={activeProjectId} projectName={activeProjectName} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
