import React, { createContext, useContext, useState, useEffect } from 'react';
import { GrievanceModel, UserModel, AlertModel } from '../types';
import { api } from '../services/api';

export type ScreenType =
  | 'command'
  | 'explorer'
  | 'intelligence'
  | 'map'
  | 'operations'
  | 'alerts'
  | 'settings';

interface AppContextType {
  activeScreen: ScreenType;
  setActiveScreen: (screen: ScreenType) => void;
  selectedGrievanceId: string | null;
  selectedGrievance: GrievanceModel | null;
  openCaseDrawer: (id: string) => void;
  closeCaseDrawer: () => void;
  isCreateModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  activePersona: UserModel | null;
  personas: UserModel[];
  switchPersona: (user: UserModel) => void;
  districtFilter: string;
  setDistrictFilter: (district: string) => void;
  unreadAlertsCount: number;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  refreshTrigger: number;
  refreshAll: () => void;
  alerts: AlertModel[];
  reloadAlerts: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState<ScreenType>('command');
  const [selectedGrievanceId, setSelectedGrievanceId] = useState<string | null>(null);
  const [selectedGrievance, setSelectedGrievance] = useState<GrievanceModel | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [personas, setPersonas] = useState<UserModel[]>([]);
  const [activePersona, setActivePersona] = useState<UserModel | null>(null);
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [alerts, setAlerts] = useState<AlertModel[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load personas on initial render
  useEffect(() => {
    async function init() {
      try {
        const users = await api.fetchPersonas();
        setPersonas(users);
        const storedRole = api.getPersona().role;
        const matched = users.find(u => u.role === storedRole) || users[0];
        if (matched) {
          setActivePersona(matched);
          api.setPersona(matched.role, matched.email);
        }
      } catch (err) {
        console.error('Failed to load personas:', err);
      }
    }
    init();
  }, []);

  // Load alerts
  const reloadAlerts = async () => {
    try {
      const data = await api.fetchAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  useEffect(() => {
    reloadAlerts();
  }, [refreshTrigger]);

  // Load selected grievance details whenever selectedGrievanceId changes
  useEffect(() => {
    if (!selectedGrievanceId) {
      setSelectedGrievance(null);
      return;
    }
    let isCurrent = true;
    api
      .fetchGrievanceById(selectedGrievanceId)
      .then(data => {
        if (isCurrent) setSelectedGrievance(data);
      })
      .catch(err => {
        console.error('Failed to load grievance details:', err);
      });
    return () => {
      isCurrent = false;
    };
  }, [selectedGrievanceId, refreshTrigger]);

  const switchPersona = (user: UserModel) => {
    setActivePersona(user);
    api.setPersona(user.role, user.email);
    setRefreshTrigger(prev => prev + 1);
  };

  const openCaseDrawer = (id: string) => {
    setSelectedGrievanceId(id);
  };

  const closeCaseDrawer = () => {
    setSelectedGrievanceId(null);
    setSelectedGrievance(null);
  };

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  const refreshAll = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const unreadAlertsCount = alerts.filter(a => !a.isRead).length;

  return (
    <AppContext.Provider
      value={{
        activeScreen,
        setActiveScreen,
        selectedGrievanceId,
        selectedGrievance,
        openCaseDrawer,
        closeCaseDrawer,
        isCreateModalOpen,
        openCreateModal,
        closeCreateModal,
        activePersona,
        personas,
        switchPersona,
        districtFilter,
        setDistrictFilter,
        unreadAlertsCount,
        isNotificationsOpen,
        setIsNotificationsOpen,
        refreshTrigger,
        refreshAll,
        alerts,
        reloadAlerts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
