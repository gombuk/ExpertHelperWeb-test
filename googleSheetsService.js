
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Flexible mappings: Arrays allow supporting multiple header names (User's screenshot vs Default)
const CONCLUSIONS_MAPPING = {
    id: ['ID'],
    registrationNumber: ['# Реєстраційний №', 'РЕЄСТР. №', 'Реєстраційний №'],
    actNumber: ['Акт', 'АКТ'],
    startDate: ['Дата початку', 'ДАТА ПОЧАТКУ'],
    endDate: ['Дата закінчення', 'ДАТА ЗАКІНЧЕННЯ'],
    companyName: ['Назва компанії', 'НАЗВА КОМПАНІЇ'],
    comment: ['# Коментар', 'КОМЕНТАР', 'Коментар'],
    units: ['# Одиниці', 'ОДИНИЦІ', 'Одиниці'],
    models: ['# Моделі', 'МОДЕЛІ', 'Моделі'],
    positions: ['# Позиції', 'ПОЗИЦІЇ', 'Позиції'],
    pages: ['Сторінки', 'СТОРІНКИ'],
    codes: ['# Коди', 'КОДИ', 'Коди'],
    complexity: ['Складність', 'СКЛАДНІСТЬ'],
    urgency: ['Терміновість', 'ТЕРМІНОВІСТЬ'],
    discount: ['Знижка', 'ЗНИЖКА'],
    conclusionType: ['Тариф', 'ТАРИФ'],
    expert: ["Ім'я експерта", "ІМ'Я ЕКСПЕРТА", "Експерт", "ПІБ Експерта"],
    status: ['Статус', 'СТАТУС'],
    customCost: ['Вартість (вручну)', 'ВАРТІСТЬ (ВРУЧНУ)']
};

const CERTIFICATES_MAPPING = {
    id: ['ID'],
    registrationNumber: ['# Реєстраційний №', 'РЕЄСТР. №', 'Реєстраційний №'],
    actNumber: ['Акт', 'АКТ'],
    startDate: ['Дата початку', 'ДАТА ПОЧАТКУ'],
    endDate: ['Дата закінчення', 'ДАТА ЗАКІНЧЕННЯ'],
    companyName: ['Назва компанії', 'НАЗВА КОМПАНІЇ'],
    comment: ['# Коментар', 'КОМЕНТАР', 'Коментар'],
    certificateForm: ['Форма сертифікату', 'ФОРМА СЕРТИФІКАТУ'],
    certificateServiceType: ['Тип послуги', 'ТИП ПОСЛУГИ'],
    productionType: ['Тип виробництва', 'ТИП ВИРОБНИЦТВА'],
    units: ['Кількість сертифікатів', 'КІЛ-СТЬ СЕРТИФІКАТІВ', '# Одиниці'],
    pages: ['Сторінки', 'СТОРІНКИ'],
    additionalPages: ['Дод. аркуші', 'ДОД. АРКУШІ'],
    positions: ['Кількість дод. позицій', 'КІЛ-СТЬ ДОД. ПОЗИЦІЙ'],
    urgency: ['Терміновість', 'ТЕРМІНОВІСТЬ'],
    expert: ["ПІБ Експерта", "ПІБ ЕКСПЕРТА", "Експерт"],
    status: ['Статус', 'СТАТУС']
};

async function getDoc() {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
        throw new Error('Налаштування Google (Email, Key або Sheet ID) відсутні в Environment Variables.');
    }

    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    try {
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        return doc;
    } catch (e) {
        console.error("Error loading Google Sheet:", e);
        if (e.response && e.response.status === 403) {
            throw new Error(`Доступ заборонено (403). Ви надали доступ для ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL} в налаштуваннях таблиці?`);
        } else if (e.response && e.response.status === 404) {
            throw new Error(`Таблицю не знайдено (404). Перевірте GOOGLE_SHEET_ID.`);
        }
        throw new Error(`Помилка з'єднання з Google: ${e.message}`);
    }
}

// Helper to get value checking multiple header possibilities
function getValueFromRow(row, headerKeys) {
    if (!Array.isArray(headerKeys)) return row.get(headerKeys);
    for (const key of headerKeys) {
        const val = row.get(key);
        if (val !== undefined) return val;
    }
    return undefined;
}

// Helper to find the actual header used in the sheet for writing
function getActiveHeader(sheet, headerKeys) {
    if (!Array.isArray(headerKeys)) return headerKeys;
    
    // Check actual headers in sheet
    for (const key of headerKeys) {
        if (sheet.headerValues.includes(key)) return key;
    }
    // Default to first if none found (will create new column if needed, or fail gracefully)
    return headerKeys[0];
}

// Helper to normalize date from DD.MM.YYYY to YYYY-MM-DD
function normalizeDate(dateStr) {
    if (!dateStr) return '';
    const cleanStr = String(dateStr).trim();
    // Regex for DD.MM.YYYY or D.M.YYYY
    const match = cleanStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        return `${year}-${month}-${day}`;
    }
    return cleanStr;
}

// --- Export: App -> Google Sheets ---
export async function exportToGoogleSheets(appData) {
    try {
        const doc = await getDoc();
        
        // 1. Sync Conclusions (Try 'Експертні висновки', fall back to 'Таблиця1')
        let conclusionSheet = doc.sheetsByTitle['Експертні висновки'];
        if (!conclusionSheet) conclusionSheet = doc.sheetsByTitle['Таблиця1'];

        if (conclusionSheet && appData.conclusions?.records) {
            await syncSheet(conclusionSheet, appData.conclusions.records, CONCLUSIONS_MAPPING);
        }

        // 2. Sync Certificates
        const certificateSheet = doc.sheetsByTitle['Сертифікати'];
        if (certificateSheet && appData.certificates?.records) {
            await syncSheet(certificateSheet, appData.certificates.records, CERTIFICATES_MAPPING);
        }
    } catch (e) {
        console.error("Auto-sync export failed:", e.message);
    }
}

async function syncSheet(sheet, records, mapping) {
    await sheet.loadHeaderRow(); // Ensure headers are loaded
    const rows = await sheet.getRows();
    
    const rowsToAdd = [];
    const rowsToUpdate = []; 

    for (const record of records) {
        const rowData = {};
        let recordId = record.id;

        // Map data to sheet headers
        for (const [key, headerOptions] of Object.entries(mapping)) {
            const activeHeader = getActiveHeader(sheet, headerOptions);
            
            let value = record[key];
            if (typeof value === 'boolean') value = value ? 'так' : 'ні'; // Lowercase 'так'/'ні' matches screenshot style
            if (value === undefined || value === null) value = '';
            
            // If exporting dates, ensure they might need to be DD.MM.YYYY for sheets, 
            // but usually ISO is fine or Sheet handles format. 
            // For now, we write what we have (YYYY-MM-DD from app).
            
            rowData[activeHeader] = value;
        }

        // Find existing row by ID (checking all possible ID column names)
        const idHeaders = mapping.id;
        const existingRow = rows.find(r => {
            const rowId = getValueFromRow(r, idHeaders);
            return rowId == recordId;
        });
        
        if (existingRow) {
            let hasChanges = false;
            for (const [key, headerOptions] of Object.entries(mapping)) {
                const activeHeader = getActiveHeader(sheet, headerOptions);
                // Compare existing value
                if (String(existingRow.get(activeHeader) || '') != String(rowData[activeHeader] || '')) {
                    existingRow.assign({ [activeHeader]: rowData[activeHeader] });
                    hasChanges = true;
                }
            }
            if (hasChanges) rowsToUpdate.push(existingRow);
        } else {
            rowsToAdd.push(rowData);
        }
    }

    if (rowsToAdd.length > 0) {
        await sheet.addRows(rowsToAdd);
    }
    
    if (rowsToUpdate.length > 0) {
        // Save in chunks to prevent timeout
        const CHUNK_SIZE = 50;
        for (let i = 0; i < rowsToUpdate.length; i += CHUNK_SIZE) {
            const chunk = rowsToUpdate.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map(row => row.save()));
        }
    }
}

// --- Import: Google Sheets -> App ---
export async function importFromGoogleSheets(currentAppData) {
    const doc = await getDoc(); 

    const newAppData = JSON.parse(JSON.stringify(currentAppData)); 

    // 1. Import Conclusions
    // Flexible tab name: Try 'Експертні висновки', then 'Таблиця1'
    let conclusionSheet = doc.sheetsByTitle['Експертні висновки'];
    if (!conclusionSheet) {
        conclusionSheet = doc.sheetsByTitle['Таблиця1'];
    }

    if (conclusionSheet) {
        await conclusionSheet.loadHeaderRow();
        const rows = await conclusionSheet.getRows();
        const records = rows.map(row => mapRowToRecord(row, CONCLUSIONS_MAPPING));
        // Filter out empty rows (where ID is missing)
        newAppData.conclusions.records = records.filter(r => r.id);
    } else {
        // If neither exists, we don't throw error immediately, but we can't import conclusions
        console.warn("Tab for Conclusions (Експертні висновки / Таблиця1) not found.");
    }

    // 2. Import Certificates
    const certificateSheet = doc.sheetsByTitle['Сертифікати'];
    if (certificateSheet) {
        await certificateSheet.loadHeaderRow();
        const rows = await certificateSheet.getRows();
        const records = rows.map(row => mapRowToRecord(row, CERTIFICATES_MAPPING));
        newAppData.certificates.records = records.filter(r => r.id);
    }

    return newAppData;
}

function mapRowToRecord(row, mapping) {
    const record = {};
    for (const [key, headerOptions] of Object.entries(mapping)) {
        const value = getValueFromRow(row, headerOptions);
        
        if (key === 'id' || key === 'units' || key === 'models' || key === 'positions' || 
            key === 'pages' || key === 'codes' || key === 'additionalPages' || key === 'customCost') {
            record[key] = Number(value) || 0;
        } else if (key === 'complexity' || key === 'urgency') {
            const strVal = String(value).toLowerCase().trim();
            record[key] = (strVal === 'так' || strVal === 'true' || strVal === 'yes' || strVal === '+');
        } else if (key === 'startDate' || key === 'endDate') {
            // Normalize dates to YYYY-MM-DD
            record[key] = normalizeDate(value);
        } else {
            record[key] = value || '';
        }
    }
    
    if (!record.status) record.status = 'Не проведено';
    
    return record;
}
