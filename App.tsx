import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Statistics from './components/Statistics';
import RecordsTable from './components/RecordsTable';
import Settings from './components/Settings';
import Firms from './components/Firms';
import PlanSettings from './components/PlanSettings';
import Toast from './components/Toast';
import { Record as AppRecord, CostModelRow, GeneralSettings, Firm, MonthlyPlan } from './types';

export type View = 'dashboard' | 'settings' | 'firms' | 'plan';
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
    records: [
      {
        id: 864,
        registrationNumber: "Д-864",
        expert: "Гомба Ю.В.",
        status: "Виконано",
        startDate: "2025-11-03",
        endDate: "2025-11-03",
        companyName: "ТОВ \"Сандерс-Виноградів\"",
        comment: "-",
        units: 2568,
        models: 3,
        positions: 10,
        codes: 3,
        complexity: true,
        urgency: true,
        discount: "Зі знижкою",
        actNumber: "А-864",
        conclusionType: "standard"
      },
      {
        id: 863,
        registrationNumber: "Д-863",
        expert: "Гомба Ю.В.",
        status: "Виконано",
        startDate: "2025-11-02",
        endDate: "2025-11-02",
        companyName: "ТОВ \"Сандерс-Виноградів\"",
        comment: "додаток 140",
        units: 3837,
        models: 6,
        positions: 15,
        codes: 6,
        complexity: true,
        urgency: true,
        discount: "Зі знижкою",
        conclusionType: "standard"
      },
      {
        id: 862,
        registrationNumber: "Д-862",
        expert: "Гомба Ю.В.",
        status: "Виконано",
        startDate: "2025-10-31",
        endDate: "2025-11-03",
        companyName: "ТОВ \"ТРІО\"",
        comment: "-",
        units: 20211,
        models: 10,
        positions: 11,
        codes: 5,
        complexity: true,
        urgency: false,
        discount: "Зі знижкою",
        conclusionType: "standard"
      },
      {
        id: 859,
        registrationNumber: "Д-859",
        expert: "Палчей Я.В.",
        status: "Не виконано",
        startDate: "2025-10-31",
        endDate: "2025-10-31",
        companyName: "ТОВ \"Новітекс\"",
        comment: "-",
        units: 582,
        models: 14,
        positions: 81,
        codes: 1,
        complexity: true,
        urgency: true,
        discount: "Зі знижкою",
        conclusionType: "standard"
      },
      {
        id: 858,
        registrationNumber: "Д-858",
        expert: "Палчей Я.В.",
        status: "Не виконано",
        startDate: "2025-10-30",
        endDate: "2025-10-31",
        companyName: "ТОВ \"Флоріан Шуз\"",
        comment: "-",
        units: 12478,
        models: 6,
        positions: 26,
        codes: 1,
        complexity: true,
        urgency: false,
        discount: "Повна",
        conclusionType: "standard"
      },
      {
        id: 857,
        registrationNumber: "Д-857",
        expert: "Гомба Ю.В.",
        status: "Не виконано",
        startDate: "2025-11-01",
        endDate: "2025-11-02",
        companyName: "ТОВ \"ТРІО\"",
        comment: "додаток 338",
        units: 1031,
        models: 3,
        positions: 10,
        codes: 3,
        complexity: true,
        urgency: true,
        discount: "Зі знижкою",
        conclusionType: "standard"
      },
      {
        id: 865,
        registrationNumber: "Д-865",
        expert: "Дан Т.О.",
        status: "Виконано",
        startDate: "2025-11-04",
        endDate: "2025-11-04",
        companyName: "ТОВ \"Новітекс\"",
        comment: "договірний",
        units: 1,
        models: 0,
        positions: 0,
        codes: 2,
        complexity: false,
        urgency: false,
        discount: "Зі знижкою",
        actNumber: "А-865",
        conclusionType: "contractual",
        pages: 5
      }
    ],
    costModelTable: [
      {
        id: 1,
        models: 1,
        upTo10: "1200",
        upTo20: "1260",
        upTo50: "1320",
        plus51: "1350"
      },
      {
        id: 2,
        models: 2,
        upTo10: "1270",
        upTo20: "1330",
        upTo50: "1390",
        plus51: "1420"
      },
      {
        id: 3,
        models: 3,
        upTo10: "1340",
        upTo20: "1400",
        upTo50: "1460",
        plus51: "1490"
      },
      {
        id: 4,
        models: 4,
        upTo10: "1410",
        upTo20: "1470",
        upTo50: "1530",
        plus51: "1560"
      },
      {
        id: 5,
        models: 5,
        upTo10: "1480",
        upTo20: "1540",
        upTo50: "1600",
        plus51: "1630"
      },
      {
        id: 6,
        models: 6,
        upTo10: "1550",
        upTo20: "1610",
        upTo50: "1670",
        plus51: "1700"
      },
      {
        id: 7,
        models: 10,
        upTo10: "1800",
        upTo20: "1900",
        upTo50: "2000",
        plus51: "2100"
      },
      {
        id: 8,
        models: 14,
        upTo10: "2200",
        upTo20: "2300",
        upTo50: "2400",
        plus51: "2500"
      }
    ],
    generalSettings: {
      urgency: 100,
      codeCost: 180,
      discount: 10,
      complexity: 30,
      contractualPageCost: 1560
    },
    monthlyPlans: {
      "2025-10": {
        totalPlan: 300000,
        expertPlans: [
          {
            id: 1,
            name: "Гомба Ю.В.",
            planAmount: "100000"
          },
          {
            id: 2,
            name: "Дан Т.О.",
            planAmount: "100000"
          },
          {
            id: 3,
            name: "Палчей Я.В.",
            planAmount: "100000"
          }
        ]
      },
      "2025-11": {
        totalPlan: 350000,
        expertPlans: [
          {
            id: 1,
            name: "Гомба Ю.В.",
            planAmount: "150000"
          },
          {
            id: 3,
            name: "Палчей Я.В.",
            planAmount: "120000"
          }
        ]
      }
    },
    firms: [
      {
        id: 1,
        name: "ТОВ \"Сандерс-Виноградів\"",
        address: "М.ВИНОГРАДІВ, ВУЛ. КОМУНАЛЬНА , 10",
        directorName: "Розентал Є.Г.",
        edrpou: "12345678",
        taxNumber: "123456789012",
        productName: "Взуття"
      },
      {
        id: 3,
        name: "ТОВ \"ТРІО\"",
        address: "М.КИЇВ, ВУЛ. ХРЕЩАТИК, 1",
        directorName: "Іванов І.І.",
        edrpou: "34567890",
        taxNumber: "345678901234",
        productName: "Аксесуари"
      },
      {
        id: 4,
        name: "ТОВ \"Новітекс\"",
        address: "м. Виноградів",
        directorName: "Палчей Я.В.",
        edrpou: "34514696",
        taxNumber: "345146907052",
        productName: "Шкіряні вироби"
      },
      {
        id: 5,
        name: "ТОВ \"Флоріан Шуз\"",
        address: "М.ОДЕСА, ВУЛ. ДЕРИБАСІВСЬКА, 5",
        directorName: "Сидоренко С.С.",
        edrpou: "56789012",
        taxNumber: "567890123456",
        productName: "Взуття"
      }
    ]
  },
  certificates: {
    records: [
      {
        id: 101,
        registrationNumber: "C-101",
        expert: "Дан Т.О.",
        status: "Виконано",
        startDate: "2025-11-05",
        endDate: "2025-11-06",
        companyName: "ТОВ \"СЛІП АЙДІ УКРАЇНА\"",
        comment: "сертифікат походження",
        units: 2,
        positions: 5,
        urgency: false,
        certificateForm: "СТ-1",
        pages: 18,
        additionalPages: 2,
        productionType: "fully_produced",
        certificateServiceType: "standard",
        actNumber: "АКТ-C-101"
      },
      {
        id: 102,
        registrationNumber: "C-102",
        expert: "Гомба Ю.В.",
        status: "Не виконано",
        startDate: "2025-11-07",
        endDate: "2025-11-08",
        companyName: "ТОВ \"Новітекс\"",
        comment: "",
        units: 1,
        positions: 12,
        urgency: true,
        certificateForm: "А",
        pages: 25,
        additionalPages: 0,
        productionType: "sufficient_processing",
        certificateServiceType: "standard"
      }
    ],
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
    monthlyPlans: {
      "2025-11": {
        totalPlan: 50000,
        expertPlans: [
          {
            id: 1,
            name: "Дан Т.О.",
            planAmount: "25000"
          },
          {
            id: 2,
            name: "Гомба Ю.В.",
            planAmount: "25000"
          }
        ]
      }
    },
    firms: [
      {
        id: 2,
        name: "ТОВ \"СЛІП АЙДІ УКРАЇНА\"",
        address: "М.ІРШАВА, ВУЛ. ГАГАРІНА , 49",
        directorName: "Розентал Є.Г.",
        edrpou: "23456789",
        taxNumber: "234567890123",
        productName: "Одяг"
      },
      {
        id: 4,
        name: "ТОВ \"Новітекс\"",
        address: "м. Виноградів",
        directorName: "Палчей Я.В.",
        edrpou: "34514696",
        taxNumber: "345146907052",
        productName: "Шкіряні вироби"
      }
    ]
  }
};

const API_URL = '/api/data';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [activeMode, setActiveMode] = useState<AppMode>('conclusions');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [appData, setAppData] = useState<AppData>(initialAppData);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => {
          setToast(null);
      }, 3000);
  }, []);

  // --- Data Persistence Logic ---

  // 1. Load data on startup
  useEffect(() => {
      const loadData = async () => {
          try {
              // Try fetching from server first
              const response = await fetch(API_URL);
              if (response.ok) {
                  const serverData = await response.json();
                  if (serverData && Object.keys(serverData).length > 0) {
                      setAppData(serverData);
                      console.log('Data loaded from server');
                  } else {
                       // Server empty, try local storage fallback
                       loadFromLocalStorage();
                  }
              } else {
                  throw new Error('Server not reachable');
              }
          } catch (error) {
              console.warn('Could not load from server, falling back to localStorage', error);
              loadFromLocalStorage();
          } finally {
              setIsDataLoaded(true);
          }
      };

      const loadFromLocalStorage = () => {
           const savedData = localStorage.getItem('appData');
           if (savedData) {
               try {
                   setAppData(JSON.parse(savedData));
                   console.log('Data loaded from localStorage');
               } catch (e) {
                   console.error('Failed to parse localStorage data', e);
               }
           }
      };

      loadData();
  }, []);

  // 2. Save data on change
  useEffect(() => {
      if (!isDataLoaded) return; // Don't save before initial load is complete

      // Save to localStorage (always as backup)
      localStorage.setItem('appData', JSON.stringify(appData));

      // Try saving to server
      const saveDataToServer = async () => {
          try {
              await fetch(API_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(appData),
              });
          } catch (error) {
               // Silent fail for server save if offline, already saved to localStorage
               // console.warn('Failed to save to server', error);
          }
      };
      saveDataToServer();

  }, [appData, isDataLoaded]);

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

  const exportRecords = useCallback(() => {
    const dataToExport = appData[activeMode].records;
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeMode}_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Експорт успішний.');
  }, [appData, activeMode, showToast]);


  
  const [selectedExpert, setSelectedExpert] = useState('all');
  
  // Initialize selectedMonth based on data
  const initialSelectedMonth = useMemo(() => {
    const allMonths = new Set<string>();
    Object.keys(initialAppData.conclusions.monthlyPlans).forEach(month => allMonths.add(month));
    Object.keys(initialAppData.certificates.monthlyPlans).forEach(month => allMonths.add(month));
    const sortedMonths = Array.from(allMonths).sort((a, b) => b.localeCompare(a)); // Descending order
    return sortedMonths.length > 0 ? sortedMonths[0] : new Date().toISOString().slice(0, 7);
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(initialSelectedMonth);

  // Dark mode state and logic
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
    // Update selectedMonth if initial data changes or if the current selectedMonth is no longer valid
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
    const recordType = activeMode === 'conclusions' ? 'Експертний висновок' : 'Сертифікат';
    showToast(`${recordType} №${newRecord.registrationNumber} для ${newRecord.companyName} зареєстрований.`);
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
    showToast('Запис оновлено успішно!');
  };
  
  const deleteRecord = (id: number) => {
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: {
        ...prevData[activeMode],
        records: prevData[activeMode].records.filter(record => record.id !== id),
      },
    }));
    showToast('Запис видалено успішно!');
  };

  const setCostModelTable = (newTable: CostModelRow[]) => {
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: {
        ...prevData[activeMode],
        costModelTable: newTable,
      },
    }));
    showToast('Таблицю вартості оновлено.');
  };

  const setGeneralSettings = (newSettings: GeneralSettings) => {
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: {
        ...prevData[activeMode],
        generalSettings: newSettings,
      },
    }));
    showToast('Загальні налаштування оновлено.');
  };
  
  const setMonthlyPlans = (newPlans: Record<string, MonthlyPlan>) => {
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: {
        ...prevData[activeMode],
        monthlyPlans: newPlans,
      },
    }));
    showToast('Місячні плани оновлено.');
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
    showToast('Фірму додано успішно!');
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
    showToast('Фірму оновлено успішно!');
  };

  const deleteFirm = (id: number) => {
    setAppData(prevData => ({
      ...prevData,
      [activeMode]: {
        ...prevData[activeMode],
        firms: prevData[activeMode].firms.filter(firm => firm.id !== id),
      },
    }));
    showToast('Фірму видалено успішно!');
  };

  const copyFirmToOtherMode = (firmToCopy: Firm) => {
    const sourceMode = activeMode;
    const targetMode = sourceMode === 'conclusions' ? 'certificates' : 'conclusions';
    const targetModeName = targetMode === 'conclusions' ? 'Висновки' : 'Сертифікати';

    const targetFirms = appData[targetMode].firms;
    const firmExists = targetFirms.some(f => f.name.toLowerCase() === firmToCopy.name.toLowerCase());

    if (firmExists) {
        showToast(`Фірму "${firmToCopy.name}" вже існує у списку "${targetModeName}".`, 'error');
        return;
    }

    const newFirm: Omit<Firm, 'id'> = {
        name: firmToCopy.name,
        address: firmToCopy.address,
        directorName: firmToCopy.directorName,
        edrpou: firmToCopy.edrpou,
        taxNumber: firmToCopy.taxNumber,
        productName: firmToCopy.productName,
    };
    
    const firmWithId = { ...newFirm, id: Date.now() };
    setAppData(prevData => ({
      ...prevData,
      [targetMode]: {
        ...prevData[targetMode],
        firms: [firmWithId, ...prevData[targetMode].firms],
      },
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

  const lastRegistrationNumber = useMemo(() => {
    if (currentModeData.records.length === 0) {
        return 'N/A';
    }

    const getNumericPart = (regNum: string) => {
        const match = regNum.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    };

    let latestRecord = currentModeData.records[0];
    let maxNumericPart = getNumericPart(latestRecord.registrationNumber);

    for (let i = 1; i < currentModeData.records.length; i++) {
        const currentRecord = currentModeData.records[i];
        const currentNumericPart = getNumericPart(currentRecord.registrationNumber);
        if (currentNumericPart > maxNumericPart) {
            maxNumericPart = currentNumericPart;
            latestRecord = currentRecord;
        }
    }
    return latestRecord.registrationNumber;
}, [currentModeData.records]);
  
  const currentMonthlyPlan = useMemo(() => {
    return currentModeData.monthlyPlans[selectedMonth] || { totalPlan: 0, expertPlans: [] };
  }, [currentModeData.monthlyPlans, selectedMonth]);


  const renderContent = () => {
    switch(currentView) {
      case 'settings':
        return <Settings 
          setCurrentView={setCurrentView} 
          generalSettings={currentModeData.generalSettings}
          setGeneralSettings={setGeneralSettings}
          costModelTable={currentModeData.costModelTable}
          setCostModelTable={setCostModelTable}
          showToast={showToast}
          activeMode={activeMode}
        />;
      case 'firms':
        return <Firms 
          setCurrentView={setCurrentView}
          firms={currentModeData.firms}
          onAddFirm={addFirm}
          onUpdateFirm={updateFirm}
          onDeleteFirm={deleteFirm}
          onCopyFirm={copyFirmToOtherMode}
          activeMode={activeMode}
          showToast={showToast}
        />;
      case 'plan':
        return <PlanSettings
          setCurrentView={setCurrentView}
          monthlyPlans={currentModeData.monthlyPlans}
          setMonthlyPlans={setMonthlyPlans}
          showToast={showToast}
        />;
      case 'dashboard':
      default:
        return (
          <>
            <Statistics 
              records={filteredRecords}
              costModelTable={currentModeData.costModelTable}
              generalSettings={currentModeData.generalSettings}
              experts={allExpertsForMode}
              selectedExpert={selectedExpert}
              setSelectedExpert={setSelectedExpert}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              monthlyPlan={currentMonthlyPlan}
              activeMode={activeMode}
              lastRegistrationNumber={lastRegistrationNumber}
            />
            <div className="mt-8">
              <RecordsTable 
                records={filteredRecords}
                onAddRecord={addRecord}
                onUpdateRecord={updateRecord}
                onDeleteRecord={deleteRecord}
                firms={currentModeData.firms}
                experts={allExpertsForMode}
                costModelTable={currentModeData.costModelTable}
                generalSettings={currentModeData.generalSettings}
                showToast={showToast}
                activeMode={activeMode}
                selectedMonth={selectedMonth}
                onImportRecords={importRecords}
                onExportRecords={exportRecords}
              />
            </div>
          </>
        );
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 dark:bg-gray-900">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="max-w-screen-2xl mx-auto">
            <Header 
              setCurrentView={setCurrentView}
              activeMode={activeMode}
              setActiveMode={setActiveMode}
              theme={theme}
              toggleTheme={toggleTheme}
            />
            <main className="mt-8">
                {renderContent()}
            </main>
        </div>
    </div>
  );
};

export default App;