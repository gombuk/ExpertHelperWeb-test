
import type { Record as AppRecord, Firm, CostModelRow, GeneralSettings } from '../types';
import { calculateCost } from './calculateCost';
import type { AppMode } from '../App';

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
        const day = String(adjustedDate.getDate()).padStart(2, '0');
        const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
        const year = adjustedDate.getFullYear();
        return `${day}.${month}.${year}`;
    } catch (e) { return dateStr; }
};

const formatCurrencyForReport = (value: number) => new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

export const generateMonthlyReportHtml = (
    allRecords: AppRecord[],
    firms: Firm[],
    costModelTable: CostModelRow[],
    generalSettings: GeneralSettings,
    selectedMonth: string,
    activeMode: AppMode
): string => {
    const isConclusions = activeMode === 'conclusions';
    const [year, monthIndexStr] = selectedMonth.split('-');
    const monthNames = ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'];
    const monthName = monthNames[parseInt(monthIndexStr, 10) - 1];
    const reportTitle = `ЗВІТ ${isConclusions ? 'ЕКСПЕРТИЗИ' : 'СЕРТИФІКАТІВ'} ЗА ${monthName.toUpperCase()} ${year} РІК`;

    const recordsWithCost = allRecords
        .filter(record => record.endDate.substring(0, 7) === selectedMonth)
        .map(record => {
            const { sumWithoutDiscount, sumWithDiscount } = calculateCost(record, costModelTable, generalSettings, activeMode);
            return { ...record, calculatedSum: isConclusions ? sumWithDiscount : sumWithoutDiscount };
        })
        .sort((a, b) => a.expert.localeCompare(b.expert) || a.companyName.localeCompare(b.companyName));

    let tableRowsHtml = '';
    let grandTotalSum = 0;
    
    recordsWithCost.forEach(r => {
        const numericReg = r.registrationNumber.match(/(\d+)/)?.[1] || r.registrationNumber;
        tableRowsHtml += `<tr><td>${r.companyName}</td><td>${numericReg}</td><td>${isConclusions ? 1 : r.units}</td><td>${formatDate(r.endDate)}</td><td style="text-align:right">${formatCurrencyForReport(r.calculatedSum)}</td></tr>`;
        grandTotalSum += r.calculatedSum;
    });

    return `<html><head><title>${reportTitle}</title><style>body{font-family:serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:5px}th{background:#f2f2f2}</style></head><body><h1>${reportTitle}</h1><table><thead><tr><th>Замовник</th><th>№ наряду</th><th>Кількість</th><th>Дата видачі</th><th>Сума, грн</th></tr></thead><tbody>${tableRowsHtml}<tr><td colspan="4">Всього:</td><td style="text-align:right">${formatCurrencyForReport(grandTotalSum)}</td></tr></tbody></table></body></html>`;
};

export const generateOrderHtml = (record: AppRecord, firm: Firm, costModelTable: CostModelRow[], generalSettings: GeneralSettings) => {
    const { sumWithDiscount } = calculateCost(record, costModelTable, generalSettings, 'conclusions');
    const vat = sumWithDiscount * 0.2;
    return `<html><head><style>body{font-family:serif;padding:20px}</style></head><body><h1>Наряд №${record.registrationNumber}</h1><p>Компанія: ${firm.name}</p><p>Сума: ${formatCurrencyForReport(sumWithDiscount + vat)} грн</p><button onclick="window.print()">Друк</button></body></html>`;
};

export const generateCertificateOrderHtml = (record: AppRecord, firm: Firm, generalSettings: GeneralSettings) => {
    const { sumWithoutDiscount } = calculateCost(record, undefined, generalSettings, 'certificates');
    return `<html><head><style>body{font-family:serif;padding:20px}</style></head><body><h1>Сертифікат №${record.registrationNumber}</h1><p>Замовник: ${firm.name}</p><p>Сума: ${formatCurrencyForReport(sumWithoutDiscount * 1.2)} грн</p></body></html>`;
};

export const generateCertificateActHtml = (record: AppRecord, firm: Firm, generalSettings: GeneralSettings) => { return "<h1>Act HTML placeholder</h1>"; };
export const generateFirmsHtml = (firms: Firm[], activeMode: string) => { return "<h1>Firms HTML placeholder</h1>"; };
export const generateRecordsHtml = (records: any[], activeMode: string) => { return "<h1>Records List HTML placeholder</h1>"; };
export const generateJournalHtml = (records: any[], firms: Firm[], activeMode: string) => { return "<h1>Journal HTML placeholder</h1>"; };
