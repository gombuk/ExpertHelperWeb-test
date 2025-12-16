
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Mapping definitions to translate between App JSON keys and Sheet Column Headers
const CONCLUSIONS_MAPPING = {
    id: 'ID',
    registrationNumber: 'РЕЄСТР. №',
    actNumber: 'АКТ',
    startDate: 'ДАТА ПОЧАТКУ',
    endDate: 'ДАТА ЗАКІНЧЕННЯ',
    companyName: 'НАЗВА КОМПАНІЇ',
    comment: 'КОМЕНТАР',
    units: 'ОДИНИЦІ',
    models: 'МОДЕЛІ',
    positions: 'ПОЗИЦІЇ',
    pages: 'СТОРІНКИ',
    codes: 'КОДИ',
    complexity: 'СКЛАДНІСТЬ', // boolean to string
    urgency: 'ТЕРМІНОВІСТЬ', // boolean to string
    discount: 'ЗНИЖКА',
    conclusionType: 'ТАРИФ',
    expert: "ІМ'Я ЕКСПЕРТА",
    status: 'СТАТУС',
    customCost: 'ВАРТІСТЬ (ВРУЧНУ)'
};

const CERTIFICATES_MAPPING = {
    id: 'ID',
    registrationNumber: 'РЕЄСТР. №',
    actNumber: 'АКТ',
    startDate: 'ДАТА ПОЧАТКУ',
    endDate: 'ДАТА ЗАКІНЧЕННЯ',
    companyName: 'НАЗВА КОМПАНІЇ',
    comment: 'КОМЕНТАР',
    certificateForm: 'ФОРМА СЕРТИФІКАТУ',
    certificateServiceType: 'ТИП ПОСЛУГИ',
    productionType: 'ТИП ВИРОБНИЦТВА',
    units: 'КІЛ-СТЬ СЕРТИФІКАТІВ',
    pages: 'СТОРІНКИ',
    additionalPages: 'ДОД. АРКУШІ',
    positions: 'КІЛ-СТЬ ДОД. ПОЗИЦІЙ',
    urgency: 'ТЕРМІНОВІСТЬ',
    expert: 'ПІБ ЕКСПЕРТА',
    status: 'СТАТУС'
};

const SHEET_ID = '109egQoJF8oTBliTBemoJVenje3FhLFhhihy1R_Xjcao';

async function getDoc() {
    // These ENVs must be set in Render
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        console.warn('Google Credentials not found in environment variables.');
        return null;
    }

    const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    return doc;
}

// --- Export: App -> Google Sheets ---
export async function exportToGoogleSheets(appData) {
    const doc = await getDoc();
    if (!doc) return;

    // 1. Sync Conclusions
    const conclusionSheet = doc.sheetsByTitle['Експертні висновки'];
    if (conclusionSheet && appData.conclusions?.records) {
        await syncSheet(conclusionSheet, appData.conclusions.records, CONCLUSIONS_MAPPING);
    }

    // 2. Sync Certificates
    const certificateSheet = doc.sheetsByTitle['Сертифікати'];
    if (certificateSheet && appData.certificates?.records) {
        await syncSheet(certificateSheet, appData.certificates.records, CERTIFICATES_MAPPING);
    }
}

async function syncSheet(sheet, records, mapping) {
    const rows = await sheet.getRows();
    
    // Convert app records to row objects
    const rowsToAdd = [];
    const rowsToUpdate = []; 

    for (const record of records) {
        const rowData = {};
        for (const [key, header] of Object.entries(mapping)) {
            let value = record[key];
            if (typeof value === 'boolean') value = value ? 'Так' : 'Ні';
            if (value === undefined || value === null) value = '';
            rowData[header] = value;
        }

        const existingRow = rows.find(r => r.get('ID') == record.id);
        
        if (existingRow) {
            let hasChanges = false;
            for (const header of Object.values(mapping)) {
                if (existingRow.get(header) != rowData[header]) {
                    existingRow.assign({ [header]: rowData[header] });
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
    
    await Promise.all(rowsToUpdate.map(row => row.save()));
}

// --- Import: Google Sheets -> App ---
export async function importFromGoogleSheets(currentAppData) {
    const doc = await getDoc();
    if (!doc) return null;

    const newAppData = JSON.parse(JSON.stringify(currentAppData)); 

    // 1. Import Conclusions
    const conclusionSheet = doc.sheetsByTitle['Експертні висновки'];
    if (conclusionSheet) {
        const rows = await conclusionSheet.getRows();
        const records = rows.map(row => mapRowToRecord(row, CONCLUSIONS_MAPPING));
        newAppData.conclusions.records = records;
    }

    // 2. Import Certificates
    const certificateSheet = doc.sheetsByTitle['Сертифікати'];
    if (certificateSheet) {
        const rows = await certificateSheet.getRows();
        const records = rows.map(row => mapRowToRecord(row, CERTIFICATES_MAPPING));
        newAppData.certificates.records = records;
    }

    return newAppData;
}

function mapRowToRecord(row, mapping) {
    const record = {};
    for (const [key, header] of Object.entries(mapping)) {
        const value = row.get(header);
        
        if (key === 'id' || key === 'units' || key === 'models' || key === 'positions' || 
            key === 'pages' || key === 'codes' || key === 'additionalPages' || key === 'customCost') {
            record[key] = Number(value) || 0;
        } else if (key === 'complexity' || key === 'urgency') {
            record[key] = (value === 'Так' || value === 'TRUE' || value === 'true');
        } else {
            record[key] = value || '';
        }
    }
    
    if (!record.status) record.status = 'Не проведено';
    
    return record;
}
