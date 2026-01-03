
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import Statistics from './components/Statistics';
import RecordsTable from './components/RecordsTable';
import Settings from './components/Settings';
import Firms from './components/Firms';
import PlanSettings from './components/PlanSettings';
import Toast from './components/Toast';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import { Record as AppRecord, CostModelRow, GeneralSettings, Firm, MonthlyPlan, CurrentUser, User, EditingActivity, YearSettings } from './types';

export type View = 'dashboard' | 'settings' | 'firms' | 'plan' | 'user_management';
export type AppMode = 'conclusions' | 'certificates';
export type Theme = 'light' | 'dark';

interface ModeData {
  records: AppRecord[];
  monthlyPlans: Record<string, MonthlyPlan>;
  firms: Firm[];
  yearlySettings: Record<string, YearSettings>;
}

interface AppData {
  conclusions: ModeData;
  certificates: ModeData;
}

const initialAppData: AppData = {
  conclusions: {
    records: [],
    yearlySettings: {
      "2025": {
        costModelTable: [
          { id: 1, models: 1, upTo10: "1200", upTo20: "1260", upTo50: "1320", plus51: "1350" },
          { id: 2, models: 2, upTo10: "1270", upTo20: "1330", upTo50: "1390", plus51: "1420" },
          { id: 3, models: 3, upTo10: "1340", upTo20: "1400", upTo50: "1460", plus51: "1490" },
          { id: 4, models: 4, upTo10: "1410", upTo20: "1470", upTo50: "1530", plus51: "1560" },
          { id: 5, models: 5, upTo10: "1480", upTo20: "1540", upTo50: "1600", plus51: "1630" },
          { id: 6, models: 6, upTo10: "1550", upTo20: "1610", upTo50: "1670", plus51: "1700" },
          { id: 7, models: 10, upTo10: "1800", upTo20: "1900", upTo50: "2000", plus51: "2100" },
          { id: 8, models: 14, upTo10: "2200", upTo20: "2300", upTo50: "2400", plus51: "2500" }
        ],
        generalSettings: {
          urgency: 100,
          codeCost: 180,
          discount: 10,
          complexity: 30,
          contractualPageCost: 1560
        }
      }
    },
    monthlyPlans: {},
    firms: []
  },
  certificates: {
    records: [],
    yearlySettings: {
      "2025": {
        generalSettings: {
          urgency: 150,
          replacementCost: 981,
          reissuanceCost: 409,
          duplicateCost: 490,
          additionalPageCost: 245,
          fullyProduced_upTo20PagesCost: 600,
          fullyProduced_from21To200PagesCost: 950,
          fullyProduced_plus201PagesCost: 1400,
          fullyProduced_additionalPositionCost: 75,
          sufficientProcessing_upTo20PagesCost: 700,
          sufficientProcessing_from21To200PagesCost: 1050,
          sufficientProcessing_plus201PagesCost: 1500,
          sufficientProcessing_additionalPositionCost: 85
        }
      }
    },
    monthlyPlans: {},
    firms: []
  }
};

const API_URL = '/api/data';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        try {
            return JSON.parse(savedUser);
        } catch (e) {
            console.error('Failed to parse user from session storage', e);
            return null;
        }
    }
    return null;
  });
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [activeMode, setActiveMode] = useState<AppMode>('conclusions');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [appData, setAppData] = useState<AppData>(initialAppData);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const [selectedExpert, setSelectedExpert] = useState('all');
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [editingActivity, setEditingActivity] = useState<EditingActivity[]>([]);
  
  const isRemoteUpdate = useRef(false);
  const isModalOpenRef = useRef(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => {
          setToast(null);
      }, 3000);
  }, []);

  const handleLoginSuccess = (user: CurrentUser) => {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('users');
    setCurrentUser(null);
    setUsers([]); 
  };

  const fetchDataFromServer = async (): Promise<AppData | null> => {
      try {
          const response = await fetch(API_URL);
          if (response.ok) {
              return await response.json();
          }
      } catch (error) {
          console.warn('Server unreachable for data fetch', error);
      }
      return null;
  };

  useEffect(() => {
      const loadData = async () => {
          const serverData = await fetchDataFromServer();
          if (serverData && Object.keys(serverData).length > 0) {
              // Migrating old data if necessary (one-time check)
              const data = serverData as any;
              if (data.conclusions && !data.conclusions.yearlySettings) {
                  // Transform old structure to new structure
                  data.conclusions.yearlySettings = {
                      "2025": {
                          costModelTable: data.conclusions.costModelTable,
                          generalSettings: data.conclusions.generalSettings
                      }
                  };
                  data.certificates.yearlySettings = {
                      "2025": {
                          generalSettings: data.certificates.generalSettings
                      }
                  };
                  delete data.conclusions.costModelTable;
                  delete data.conclusions.generalSettings;
                  delete data.certificates.costModelTable;
                  delete data.certificates.generalSettings;
              }
              isRemoteUpdate.current = true;
              setAppData(data);
          } else {
               const savedData = localStorage.getItem('appData');
               if (savedData) {
                   try {
                       setAppData(JSON.parse(savedData));
                   } catch(e) { console.error(e); }
               }
          }
          setIsDataLoaded(true);
      };
      loadData();
  }, []);

  useEffect(() => {
      if (!currentUser || !isDataLoaded) return;

      const pollInterval = setInterval(async () => {
          try {
              const res = await fetch('/api/activity/focus');
              if (res.ok) {
                  const activity = await res.json();
                  setEditingActivity(activity);
              }
          } catch (e) {}

          const serverData = await fetchDataFromServer();
          if (serverData) {
              const currentString = JSON.stringify(appData);
              const serverString = JSON.stringify(serverData);

              if (currentString !== serverString) {
                  if (!isModalOpenRef.current) {
                      isRemoteUpdate.current = true;
                      setAppData(serverData);
                  }
              }
          }
      }, 4000);

      return () => clearInterval(pollInterval);
  }, [currentUser, isDataLoaded, appData]);

  useEffect(() => {
      if (!isDataLoaded) return;
      localStorage.setItem('appData', JSON.stringify(appData));

      if (!isRemoteUpdate.current) {
          const saveDataToServer = async () => {
              try {
                  await fetch(API_URL, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(appData),
                  });
              } catch (error) {}
          };
          saveDataToServer();
      } else {
          isRemoteUpdate.current = false;
      }

  }, [appData, isDataLoaded]);

  const fetchUsers = useCallback(async () => {
    try {
        const response = await fetch('/api/users');
        if (response.ok) {
            const data = await response.json();
            setUsers(data);
            sessionStorage.setItem('users', JSON.stringify(data));
        } else {
            throw new Error('Failed to fetch users');
        }
    } catch (error) {
        showToast('Помилка завантаження користувачів.', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [currentUser, fetchUsers]);

  const handleAddUser = async (newUser: Omit<User, 'id'>) => {
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser),
        });
        if (!response.ok) throw new Error('Server error');
        const addedUser = await response.json();
        setUsers(prev => [...prev, addedUser]);
        showToast('Користувача створено');
    } catch (error) {}
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
        const response = await fetch(`/api/users/${updatedUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser),
        });
        if (!response.ok) throw new Error('Server error');
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        showToast('Користувача оновлено');
    } catch (error) {}
  };
  
  const handleDeleteUser = async (userId: number) => {
    try {
        const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Server error');
        setUsers(prev => prev.filter(u => u.id !== userId));
        showToast('Користувача видалено');
    } catch (error) {}
  };

  useEffect(() => {
      if (!currentUser) {
          setActiveUsers([]);
          return;
      }
      const heartbeatInterval = setInterval(async () => {
          try {
              await fetch('/api/activity/heartbeat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ login: currentUser.login, fullName: currentUser.fullName }),
              });
          } catch (error) {}
      }, 30000);

      const fetchActiveUsers = async () => {
          try {
              const response = await fetch('/api/activity/active-users');
              if (response.ok) {
                  const users = await response.json();
                  setActiveUsers(users);
              }
          } catch (error) {}
      };

      fetchActiveUsers();
      const fetchInterval = setInterval(fetchActiveUsers, 15000);

      return () => {
          clearInterval(heartbeatInterval);
          clearInterval(fetchInterval);
      };
  }, [currentUser]);
  
  const reportFocus = async (recordId: number, isEditing: boolean) => {
      if (!currentUser) return;
      isModalOpenRef.current = isEditing;
      try {
          await fetch('/api/activity/focus', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ recordId, userFullName: currentUser.fullName, isEditing }),
          });
      } catch (e) {}
  };

  const importRecords = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) return;
        const importedData = JSON.parse(content);
        if (Array.isArray(importedData)) {
          const baseId = Date.now();
          const recordsWithUniqueIds = importedData.map((record: any, index: number) => ({
            ...record,
            id: baseId + index + Math.floor(Math.random() * 1000)
          }));
          setAppData(prevData => ({
            ...prevData,
            [activeMode]: { ...prevData[activeMode], records: [...recordsWithUniqueIds, ...prevData[activeMode].records] }
          }));
          showToast(`Успішно імпортовано ${recordsWithUniqueIds.length} записів.`);
        }
      } catch (error) { showToast('Помилка при читанні файлу.', 'error'); }
    };
    reader.readAsText(file);
  }, [activeMode, showToast]);

  const exportRecords = useCallback((startDate?: string, endDate?: string) => {
    let dataToExport = appData[activeMode].records;
    if (startDate || endDate) {
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);
        dataToExport = dataToExport.filter(record => {
            try {
                const recordDate = new Date(record.endDate);
                if (isNaN(recordDate.getTime())) return false;
                const isAfterStart = start ? recordDate >= start : true;
                const isBeforeEnd = end ? recordDate <= end : true;
                return isAfterStart && isBeforeEnd;
            } catch (e) { return false; }
        });
    }
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeMode}_export.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [appData, activeMode]);
  
  const initialSelectedMonth = useMemo(() => {
    return new Date().toISOString().slice(0, 7);
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(initialSelectedMonth);
  const [theme, setTheme] = useState<Theme>(() => localStorage.getItem('theme') as Theme || 'light');

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const currentModeData = useMemo(() => appData[activeMode], [appData, activeMode]);

  const addRecord = (newRecord: Omit<AppRecord, 'id'>) => {
    const recordWithId = { ...newRecord, id: Date.now() };
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: { ...prevData[activeMode], records: [recordWithId, ...prevData[activeMode].records] },
    }));
  };
  
  const updateRecord = (updatedRecord: AppRecord) => {
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: {
        ...prevData[activeMode],
        records: prevData[activeMode].records.map(record => record.id === updatedRecord.id ? updatedRecord : record),
      },
    }));
  };
  
  const deleteRecord = (id: number) => {
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: { ...prevData[activeMode], records: prevData[activeMode].records.filter(record => record.id !== id) },
    }));
  };

  const deleteMultipleRecords = (ids: number[]) => {
    setAppData(prevData => ({
        ...prevData,
        [activeMode]: { ...prevData[activeMode], records: prevData[activeMode].records.filter(record => !ids.includes(record.id)) },
    }));
  };

  const setYearlySettings = (year: string, settings: YearSettings) => {
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: {
        ...prevData[activeMode],
        yearlySettings: { ...prevData[activeMode].yearlySettings, [year]: settings }
      },
    }));
  };
  
  const setMonthlyPlans = (newPlans: Record<string, MonthlyPlan>) => {
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: { ...prevData[activeMode], monthlyPlans: newPlans },
    }));
  };

  const addFirm = (newFirm: Omit<Firm, 'id'>) => {
    const firmWithId = { ...newFirm, id: Date.now() };
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: { ...prevData[activeMode], firms: [firmWithId, ...prevData[activeMode].firms] },
    }));
  };
  
  const updateFirm = (updatedFirm: Firm) => {
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: {
        ...prevData[activeMode],
        firms: prevData[activeMode].firms.map(firm => firm.id === updatedFirm.id ? updatedFirm : firm),
      },
    }));
  };

  const deleteFirm = (id: number) => {
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: { ...prevData[activeMode], firms: prevData[activeMode].firms.filter(firm => firm.id !== id) },
    }));
  };

  const copyFirmToOtherMode = (firmToCopy: Firm) => {
    const targetMode = activeMode === 'conclusions' ? 'certificates' : 'conclusions';
    const firmWithId = { ...firmToCopy, id: Date.now() };
    setAppData(prevData => ({
      ...prevData,
      [targetMode]: { ...prevData[targetMode], firms: [firmWithId, ...prevData[targetMode].firms] },
    }));
    showToast(`Фірму скопійовано.`);
  };
  
  const allExpertsForMode = useMemo(() => {
    return Array.from(new Set([
      ...currentModeData.records.map(r => r.expert),
      ...Object.values(currentModeData.monthlyPlans).flatMap((p: MonthlyPlan) => p.expertPlans.map(e => e.name))
    ]));
  }, [currentModeData]);

  const filteredRecords = useMemo(() => {
    return currentModeData.records.filter(record => {
      const expertMatch = selectedExpert === 'all' || record.expert === selectedExpert;
      const recordMonth = record.endDate.substring(0, 7);
      return expertMatch && recordMonth === selectedMonth;
    });
  }, [currentModeData.records, selectedExpert, selectedMonth]);

  const lastRecord = useMemo(() => {
    if (currentModeData.records.length === 0) return null;
    const getNumericPart = (regNum: string) => {
        const match = regNum.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    };
    return currentModeData.records.reduce((latest, current) => 
        getNumericPart(current.registrationNumber) > getNumericPart(latest.registrationNumber) ? current : latest
    );
  }, [currentModeData.records]);
  
  const currentMonthlyPlan = useMemo(() => {
    return currentModeData.monthlyPlans[selectedMonth] || { totalPlan: 0, expertPlans: [] };
  }, [currentModeData.monthlyPlans, selectedMonth]);

  const renderContent = () => {
    switch(currentView) {
      case 'settings':
        return <Settings setCurrentView={setCurrentView} yearlySettings={currentModeData.yearlySettings} setYearlySettings={setYearlySettings} showToast={showToast} activeMode={activeMode} />;
      case 'firms':
        return <Firms setCurrentView={setCurrentView} firms={currentModeData.firms} onAddFirm={addFirm} onUpdateFirm={updateFirm} onDeleteFirm={deleteFirm} onCopyFirm={copyFirmToOtherMode} activeMode={activeMode} showToast={showToast} />;
      case 'plan':
        return <PlanSettings setCurrentView={setCurrentView} monthlyPlans={currentModeData.monthlyPlans} setMonthlyPlans={setMonthlyPlans} showToast={showToast} />;
      case 'user_management':
        return <UserManagement setCurrentView={setCurrentView} showToast={showToast} users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />;
      case 'dashboard':
      default:
        return (
          <>
            <Statistics records={filteredRecords} yearlySettings={currentModeData.yearlySettings} experts={allExpertsForMode} selectedExpert={selectedExpert} setSelectedExpert={setSelectedExpert} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} monthlyPlan={currentMonthlyPlan} activeMode={activeMode} lastRecord={lastRecord} currentUser={currentUser} />
            <div className="mt-8">
              <RecordsTable
                records={filteredRecords}
                allRecords={currentModeData.records}
                onAddRecord={addRecord}
                onUpdateRecord={updateRecord}
                onDeleteRecord={deleteRecord}
                onDeleteMultipleRecords={deleteMultipleRecords}
                firms={currentModeData.firms}
                experts={allExpertsForMode}
                yearlySettings={currentModeData.yearlySettings}
                showToast={showToast}
                activeMode={activeMode}
                selectedMonth={selectedMonth}
                onImportRecords={importRecords}
                onExportRecords={exportRecords}
                currentUser={currentUser}
                editingActivity={editingActivity}
                onReportFocus={reportFocus}
              />
            </div>
          </>
        );
    }
  };

  if (!currentUser) return <Login onLoginSuccess={handleLoginSuccess} users={users} />;

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 dark:bg-gray-900">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="max-w-screen-2xl mx-auto">
            <Header setCurrentView={setCurrentView} activeMode={activeMode} setActiveMode={setActiveMode} theme={theme} toggleTheme={toggleTheme} currentUser={currentUser} onLogout={handleLogout} activeUsers={activeUsers} />
            <main className="mt-8">{renderContent()}</main>
        </div>
    </div>
  );
};

export default App;
