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
import { Record as AppRecord, CostModelRow, GeneralSettings, Firm, MonthlyPlan, CurrentUser, User, EditingActivity } from './types';

export type View = 'dashboard' | 'settings' | 'firms' | 'plan' | 'user_management';
export type AppMode = 'conclusions' | 'certificates';
export type Theme = 'light' | 'dark';

interface AppData {
  conclusions: {
    records: AppRecord[];
    costModelTable: CostModelRow[];
    generalSettings: GeneralSettings;
    monthlyPlans: Record<string, MonthlyPlan>;
    firms: Firm[];
  };
  certificates: {
    records: AppRecord[];
    costModelTable: CostModelRow[];
    generalSettings: GeneralSettings;
    monthlyPlans: Record<string, MonthlyPlan>;
    firms: Firm[];
  };
}

const initialAppData: AppData = {
  conclusions: {
    records: [],
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
    },
    monthlyPlans: {},
    firms: []
  },
  certificates: {
    records: [],
    costModelTable: [],
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
  
  // Ref to track if an update was initiated by the current client to prevent redundant saves/loops
  const isRemoteUpdate = useRef(false);
  // Ref to track if a modal is open (to pause aggressive syncs)
  const isModalOpenRef = useRef(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => {
          setToast(null);
      }, 3000);
  }, []);

  // --- Authentication Logic ---
  const handleLoginSuccess = (user: CurrentUser) => {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('users'); // Clear users cache on logout
    setCurrentUser(null);
    setUsers([]); 
  };

  // --- Data Persistence Logic ---
  
  // Helper to fetch data from server
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

  // Initial Load
  useEffect(() => {
      const loadData = async () => {
          const serverData = await fetchDataFromServer();
          if (serverData && Object.keys(serverData).length > 0) {
              isRemoteUpdate.current = true;
              setAppData(serverData);
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

  // Auto-Sync / Polling
  useEffect(() => {
      if (!currentUser || !isDataLoaded) return;

      const pollInterval = setInterval(async () => {
          // Poll for active editing status
          try {
              const res = await fetch('/api/activity/focus');
              if (res.ok) {
                  const activity = await res.json();
                  setEditingActivity(activity);
              }
          } catch (e) {}

          // Poll for Data Updates
          const serverData = await fetchDataFromServer();
          if (serverData) {
              // Cheap comparison: stringify
              const currentString = JSON.stringify(appData);
              const serverString = JSON.stringify(serverData);

              if (currentString !== serverString) {
                  if (!isModalOpenRef.current) {
                      // Safe to update if no modal is open
                      isRemoteUpdate.current = true;
                      setAppData(serverData);
                  } else {
                      // Don't overwrite if user is editing, but maybe notify?
                      // Optional: showToast('Дані оновлено на сервері', 'info');
                  }
              }
          }
      }, 4000); // Poll every 4 seconds

      return () => clearInterval(pollInterval);
  }, [currentUser, isDataLoaded, appData]);


  // Save on Change (Debounced if needed, but effectively instant here)
  useEffect(() => {
      if (!isDataLoaded) return;
      
      // Save to LocalStorage always
      localStorage.setItem('appData', JSON.stringify(appData));

      // Save to Server ONLY if it's a local change
      if (!isRemoteUpdate.current) {
          const saveDataToServer = async () => {
              try {
                  await fetch(API_URL, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(appData),
                  });
              } catch (error) {
                  // Silent fail
              }
          };
          saveDataToServer();
      } else {
          // Reset flag after remote update is applied
          isRemoteUpdate.current = false;
      }

  }, [appData, isDataLoaded]);

  // --- User Management Logic ---
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
        showToast('Помилка завантаження користувачів. Використовуються демонстраційні дані.', 'error');
        const savedUsers = sessionStorage.getItem('users');
        if (savedUsers) {
            setUsers(JSON.parse(savedUsers) as User[]);
        } else {
            const fallbackUsers: User[] = [
                { id: 1, login: 'admin', fullName: 'Адміністратор', password: 'Admin2025!', role: 'admin' },
                { id: 2, login: 'Gomba', fullName: 'Гомба Ю.В.', password: 'Gomba2025!', role: 'user' },
                { id: 3, login: 'Dan', fullName: 'Дан Т.О.', password: 'Dan2025!', role: 'user' },
                { id: 4, login: 'Snietkov', fullName: 'Снєтков С.Ю.', password: 'Snietkov2025!', role: 'user' }
            ];
            setUsers(fallbackUsers);
            sessionStorage.setItem('users', JSON.stringify(fallbackUsers));
        }
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
        const updatedUsers = [...users, addedUser];
        setUsers(updatedUsers);
        sessionStorage.setItem('users', JSON.stringify(updatedUsers));
        showToast('Користувача створено');
    } catch (error) {
        // Fallback for AI Studio
        const userWithId = { ...newUser, id: Date.now() };
        const updatedUsers = [...users, userWithId];
        setUsers(updatedUsers);
        sessionStorage.setItem('users', JSON.stringify(updatedUsers));
        showToast('Користувача створено');
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
        const response = await fetch(`/api/users/${updatedUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser),
        });
        if (!response.ok) throw new Error('Server error');
        const returnedUser = await response.json();
        const updatedUsers = users.map(u => u.id === returnedUser.id ? returnedUser : u);
        setUsers(updatedUsers);
        sessionStorage.setItem('users', JSON.stringify(updatedUsers));
        showToast('Користувача оновлено');
    } catch (error) {
        // Fallback for AI Studio
        const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
        setUsers(updatedUsers);
        sessionStorage.setItem('users', JSON.stringify(updatedUsers));
        showToast('Користувача оновлено');
    }
  };
  
  const handleDeleteUser = async (userId: number) => {
    try {
        const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Server error');
        const updatedUsers = users.filter(u => u.id !== userId);
        setUsers(updatedUsers);
        sessionStorage.setItem('users', JSON.stringify(updatedUsers));
        showToast('Користувача видалено');
    } catch (error) {
        // Fallback for AI Studio
        const updatedUsers = users.filter(u => u.id !== userId);
        setUsers(updatedUsers);
        sessionStorage.setItem('users', JSON.stringify(updatedUsers));
        showToast('Користувача видалено');
    }
  };

  // --- User Activity Logic ---
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
          } catch (error) {
              // Fails silently in AI Studio or other non-server environments
          }
      }, 30000); // Send heartbeat every 30 seconds

      const fetchActiveUsers = async () => {
          try {
              const response = await fetch('/api/activity/active-users');
              if (response.ok) {
                  const users = await response.json();
                  setActiveUsers(users);
              } else {
                  throw new Error('Server responded with non-OK status');
              }
          } catch (error) {
               console.warn("Could not fetch active users.");
               setActiveUsers([]);
          }
      };

      fetchActiveUsers(); // Initial fetch
      const fetchInterval = setInterval(fetchActiveUsers, 15000); // Re-fetch every 15 seconds

      return () => {
          clearInterval(heartbeatInterval);
          clearInterval(fetchInterval);
      };
  }, [currentUser]);
  
  // Report Focus to Server
  const reportFocus = async (recordId: number, isEditing: boolean) => {
      if (!currentUser) return;
      isModalOpenRef.current = isEditing; // Track modal state
      try {
          await fetch('/api/activity/focus', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ recordId, userFullName: currentUser.fullName, isEditing }),
          });
          // Refresh activity list immediately to reflect own action
          const res = await fetch('/api/activity/focus');
          if (res.ok) {
              const activity = await res.json();
              setEditingActivity(activity);
          }
      } catch (e) { console.error("Focus report failed", e); }
  };

  // --- Import / Export Logic ---
  const importRecords = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData)) {
          setAppData(prevData => ({
            ...prevData,
            [activeMode]: {
              ...prevData[activeMode],
              records: [...importedData, ...prevData[activeMode].records]
            }
          }));
          showToast(`Успішно імпортовано ${importedData.length} записів.`);
        } else {
          showToast('Невірний формат файлу. Очікується масив записів.', 'error');
        }
      } catch (error) {
        showToast('Помилка при читанні файлу.', 'error');
        console.error("Import error:", error);
      }
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
                if (isNaN(recordDate.getTime())) return false; // Skip invalid dates
                
                const isAfterStart = start ? recordDate >= start : true;
                const isBeforeEnd = end ? recordDate <= end : true;
                return isAfterStart && isBeforeEnd;
            } catch (e) {
                return false;
            }
        });
        
        if (dataToExport.length === 0) {
            showToast('Не знайдено записів за вибраний період.', 'error');
            return;
        }
    }

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    let period = new Date().toISOString().slice(0, 10);
    if (startDate && endDate) {
        period = `${startDate}_${endDate}`;
    } else if (startDate) {
        period = `from_${startDate}`;
    } else if (endDate) {
        period = `to_${endDate}`;
    }

    link.download = `${activeMode}_export_${period}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Експорт ${dataToExport.length} записів успішний.`);
  }, [appData, activeMode, showToast]);
  
  // Initialize selectedMonth based on data
  const initialSelectedMonth = useMemo(() => {
    const allMonths = new Set<string>();
    Object.keys(initialAppData.conclusions.monthlyPlans).forEach(month => allMonths.add(month));
    Object.keys(initialAppData.certificates.monthlyPlans).forEach(month => allMonths.add(month));
    const sortedMonths = Array.from(allMonths).sort((a, b) => b.localeCompare(a));
    return sortedMonths.length > 0 ? sortedMonths[0] : new Date().toISOString().slice(0, 7);
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(initialSelectedMonth);

  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const allMonths = new Set<string>();
    Object.keys(appData.conclusions.monthlyPlans).forEach(month => allMonths.add(month));
    Object.keys(appData.certificates.monthlyPlans).forEach(month => allMonths.add(month));
    const sortedMonths = Array.from(allMonths).sort((a, b) => b.localeCompare(a));
    
    if (sortedMonths.length > 0 && !sortedMonths.includes(selectedMonth)) {
      setSelectedMonth(sortedMonths[0]);
    } else if (sortedMonths.length === 0) {
      setSelectedMonth(new Date().toISOString().slice(0, 7));
    }
  }, [appData, selectedMonth]);

  const currentModeData = useMemo(() => {
    return appData[activeMode];
  }, [appData, activeMode]);

  const addRecord = (newRecord: Omit<AppRecord, 'id'>) => {
    const recordWithId = { ...newRecord, id: Date.now() };
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: {
        ...prevData[activeMode],
        records: [recordWithId, ...prevData[activeMode].records],
      },
    }));
  };
  
  const updateRecord = (updatedRecord: AppRecord) => {
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: {
        ...prevData[activeMode],
        records: prevData[activeMode].records.map(record =>
          record.id === updatedRecord.id ? updatedRecord : record
        ),
      },
    }));
  };
  
  const deleteRecord = (id: number) => {
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: {
        ...prevData[activeMode],
        records: prevData[activeMode].records.filter(record => record.id !== id),
      },
    }));
  };

  const deleteMultipleRecords = (ids: number[]) => {
    setAppData(prevData => ({
        ...prevData,
        [activeMode]: {
            ...prevData[activeMode],
            records: prevData[activeMode].records.filter(record => !ids.includes(record.id)),
        },
    }));
    showToast(`Видалено ${ids.length} запис(ів).`);
  };

  const setCostModelTable = (newTable: CostModelRow[]) => {
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: {
        ...prevData[activeMode],
        costModelTable: newTable,
      },
    }));
  };

  const setGeneralSettings = (newSettings: GeneralSettings) => {
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: {
        ...prevData[activeMode],
        generalSettings: newSettings,
      },
    }));
  };
  
  const setMonthlyPlans = (newPlans: Record<string, MonthlyPlan>) => {
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: {
        ...prevData[activeMode],
        monthlyPlans: newPlans,
      },
    }));
  };

  const addFirm = (newFirm: Omit<Firm, 'id'>) => {
    const firmWithId = { ...newFirm, id: Date.now() };
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: {
        ...prevData[activeMode],
        firms: [firmWithId, ...prevData[activeMode].firms],
      },
    }));
  };
  
  const updateFirm = (updatedFirm: Firm) => {
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: {
        ...prevData[activeMode],
        firms: prevData[activeMode].firms.map(firm =>
          firm.id === updatedFirm.id ? updatedFirm : firm
        ),
      },
    }));
  };

  const deleteFirm = (id: number) => {
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: {
        ...prevData[activeMode],
        firms: prevData[activeMode].firms.filter(firm => firm.id !== id),
      },
    }));
  };

  const copyFirmToOtherMode = (firmToCopy: Firm) => {
    const targetMode = activeMode === 'conclusions' ? 'certificates' : 'conclusions';
    const targetModeName = targetMode === 'conclusions' ? 'Висновки' : 'Сертифікати';
    const targetFirms = appData[targetMode].firms;
    if (targetFirms.some(f => f.name.toLowerCase() === firmToCopy.name.toLowerCase())) {
        showToast(`Фірму "${firmToCopy.name}" вже існує у списку "${targetModeName}".`, 'error');
        return;
    }
    const firmWithId = { ...firmToCopy, id: Date.now() };
    setAppData(prevData => ({
      ...prevData,
      [targetMode]: { ...prevData[targetMode], firms: [firmWithId, ...prevData[targetMode].firms] },
    }));
    showToast(`Фірму "${firmToCopy.name}" скопійовано до списку "${targetModeName}".`);
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
      const dateMatch = recordMonth === selectedMonth;
      return expertMatch && dateMatch;
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

  const unprocessedCountsForSnyetkov = useMemo(() => {
    if (currentUser?.fullName !== 'Снєтков С.Ю.') {
      return { conclusions: 0, certificates: 0 };
    }
    const unprocessedConclusions = appData.conclusions.records.filter(r => r.status === 'Не проведено').length;
    const unprocessedCertificates = appData.certificates.records.filter(r => r.status === 'Не проведено').length;
    return { conclusions: unprocessedConclusions, certificates: unprocessedCertificates };
  }, [appData, currentUser]);


  const renderContent = () => {
    switch(currentView) {
      case 'settings':
        return <Settings setCurrentView={setCurrentView} generalSettings={currentModeData.generalSettings} setGeneralSettings={setGeneralSettings} costModelTable={currentModeData.costModelTable} setCostModelTable={setCostModelTable} showToast={showToast} activeMode={activeMode} />;
      case 'firms':
        return <Firms setCurrentView={setCurrentView} firms={currentModeData.firms} onAddFirm={addFirm} onUpdateFirm={updateFirm} onDeleteFirm={deleteFirm} onCopyFirm={copyFirmToOtherMode} activeMode={activeMode} showToast={showToast} />;
      case 'plan':
        return <PlanSettings setCurrentView={setCurrentView} monthlyPlans={currentModeData.monthlyPlans} setMonthlyPlans={setMonthlyPlans} showToast={showToast} />;
      case 'user_management':
        return <UserManagement 
                    setCurrentView={setCurrentView} 
                    showToast={showToast} 
                    users={users}
                    onAddUser={handleAddUser}
                    onUpdateUser={handleUpdateUser}
                    onDeleteUser={handleDeleteUser}
                />;
      case 'dashboard':
      default:
        return (
          <>
            <Statistics records={filteredRecords} costModelTable={currentModeData.costModelTable} generalSettings={currentModeData.generalSettings} experts={allExpertsForMode} selectedExpert={selectedExpert} setSelectedExpert={setSelectedExpert} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} monthlyPlan={currentMonthlyPlan} activeMode={activeMode} lastRecord={lastRecord} currentUser={currentUser} />
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
                costModelTable={currentModeData.costModelTable}
                generalSettings={currentModeData.generalSettings}
                showToast={showToast}
                activeMode={activeMode}
                selectedMonth={selectedMonth}
                onImportRecords={importRecords}
                onExportRecords={exportRecords}
                currentUser={currentUser}
                unprocessedCounts={unprocessedCountsForSnyetkov}
                editingActivity={editingActivity}
                onReportFocus={reportFocus}
              />
            </div>
          </>
        );
    }
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} users={users} />;
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 dark:bg-gray-900">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="max-w-screen-2xl mx-auto">
            <Header setCurrentView={setCurrentView} activeMode={activeMode} setActiveMode={setActiveMode} theme={theme} toggleTheme={toggleTheme} currentUser={currentUser} onLogout={handleLogout} activeUsers={activeUsers} />
            <main className="mt-8">
                {renderContent()}
            </main>
        </div>
    </div>
  );
};

export default App;