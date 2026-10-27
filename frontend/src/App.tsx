import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { CommandCenterView } from './components/views/CommandCenterView';
import { GrievanceExplorerView } from './components/views/GrievanceExplorerView';
import { IncidentIntelligenceView } from './components/views/IncidentIntelligenceView';
import { GeospatialMapView } from './components/views/GeospatialMapView';
import { DepartmentOperationsView } from './components/views/DepartmentOperationsView';
import { AlertsTrendsView } from './components/views/AlertsTrendsView';
import { AdministrationSettingsView } from './components/views/AdministrationSettingsView';
import { CaseDetailDrawer } from './components/grievance/CaseDetailDrawer';
import { CreateGrievanceModal } from './components/grievance/CreateGrievanceModal';
import { GuidedDemoModal } from './components/demo/GuidedDemoModal';
import { SystemStatusModal } from './components/system/SystemStatusModal';

const MainLayout: React.FC = () => {
  const { activeScreen } = useApp();

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'command':
        return <CommandCenterView />;
      case 'explorer':
        return <GrievanceExplorerView />;
      case 'intelligence':
        return <IncidentIntelligenceView />;
      case 'map':
        return <GeospatialMapView />;
      case 'operations':
        return <DepartmentOperationsView />;
      case 'alerts':
        return <AlertsTrendsView />;
      case 'settings':
        return <AdministrationSettingsView />;
      default:
        return <CommandCenterView />;
    }
  };

  return (
    <div className="flex h-screen bg-[#070A12] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto">
          {renderActiveScreen()}
        </main>
      </div>

      {/* Case Details Drawer */}
      <CaseDetailDrawer />

      {/* Ingest Grievance Modal */}
      <CreateGrievanceModal />

      {/* Phase 4: Guided Judge Demo Modal */}
      <GuidedDemoModal />

      {/* Phase 4: System Health & Status Diagnostics Modal */}
      <SystemStatusModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
