// FIX: Aliased Record to AppRecord to avoid conflict with the built-in Record type.
import type { Record as AppRecord, Firm, CostModelRow, GeneralSettings } from '../types';
import { calculateCost } from './calculateCost'; // Import the calculateCost function
import type { AppMode } from '../App';

// Cost calculation logic
// FIX: Corrected the Omit type by using a pipe `|` to separate the keys to be omitted.
const getCostForPositions = (positions: number, costs: Omit<CostModelRow, 'id' | 'models'>): number => {
    if (positions <= 10) return Number(costs.upTo10) || 0;
    if (positions <= 20) return Number(costs.upTo20) || 0;
    if (positions <= 50) return Number(costs.upTo50) || 0;
    return Number(costs.plus51) || 0;
};

// FIX: Defined formatDate utility function.
const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        // Adjust for timezone offset to prevent date shifting by a day in some environments
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

        const day = String(adjustedDate.getDate()).padStart(2, '0');
        const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
        const year = adjustedDate.getFullYear();
        return `${day}.${month}.${year}`;
    } catch (error) {
        console.error("Error formatting date:", dateStr, error);
        return dateStr;
    }
};

const formatDateForReport = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
        
        const day = String(adjustedDate.getDate()).padStart(2, '0');
        const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
        const year = adjustedDate.getFullYear();
        return `${day}.${month}.${year}`;
    } catch (error) {
        return dateStr;
    }
};

const formatCurrencyForReport = (value: number) => {
    return new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};


// FIX: Renamed getCostComponents to generateOrderHtml and made it an exported function.
export const generateOrderHtml = (record: AppRecord, firm: Firm, costModelTable: CostModelRow[], generalSettings: GeneralSettings) => {
    // FIX: Call calculateCost to get all necessary cost components.
    const { 
        sumWithoutDiscount, sumWithDiscount, 
        modelCost, codeCostValue, complexityCost, urgencyCost, pageCost, discountMultiplier
    } = calculateCost({
        models: record.models,
        positions: record.positions,
        codes: record.codes,
        complexity: record.complexity,
        urgency: record.urgency,
        discount: record.discount,
        pages: record.pages,
        units: record.units,
        productionType: record.productionType, // Not directly used in conclusion calculation, but for type consistency
        certificateServiceType: record.certificateServiceType, // Not directly used in conclusion calculation, but for type consistency
        conclusionType: record.conclusionType,
    }, costModelTable, generalSettings, 'conclusions');

    const vat = sumWithDiscount * 0.2;
    const totalWithVat = sumWithDiscount + vat;

    if (record.conclusionType === 'contractual') {
        const emptyRowsCount = 8; // Number of empty rows to ensure consistent table height
        let emptyRowsHtml = '';
        for (let i = 0; i < emptyRowsCount; i++) {
            emptyRowsHtml += `
                <tr>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td class="num">&nbsp;</td>
                    <td class="num">&nbsp;</td>
                </tr>
            `;
        }

        return `
            <!DOCTYPE html>
            <html lang="uk">
            <head>
                <meta charset="UTF-8">
                <title>Наряд №Д-${record.registrationNumber}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
                    body {
                        font-family: 'Times New Roman', serif;
                        font-size: 11pt;
                        margin: 0;
                        padding: 20px;
                        line-height: 1.4;
                        background: #fff;
                        color: #000;
                    }
                    .container {
                        max-width: 18cm;
                        margin: auto;
                    }
                    .header { text-align: center; }
                    .header h1 { font-size: 11pt; margin: 0; font-weight: bold; }
                    .header p { font-size: 10pt; margin: 0; }
                    .order-title { margin-top: 15px; }
                    .bold { font-weight: bold; }
                    .section { margin-top: 8px; }
                    .flex { display: flex; justify-content: space-between; align-items: flex-end; }
                    .underline {
                        border-bottom: 1px solid #000;
                        flex-grow: 1;
                        margin: 0 5px;
                        text-align: center;
                        font-weight: bold;
                    }
                    .edrpou-section { display: flex; gap: 20px; margin-top: 10px; }
                    .edrpou-box { border: 1px solid #000; padding: 2px 5px; text-align: center; flex-basis: 35%; }
                    .edrpou-box .value { font-size: 11pt; font-weight: bold; }
                    .edrpou-box .label { font-size: 8pt; }
                    .details-line { display: flex; align-items: flex-end; margin-top: 8px; }
                    .details-line .label { white-space: nowrap; }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                        font-size: 9pt;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 4px;
                        text-align: left;
                        vertical-align: top;
                    }
                    th { text-align: center; font-weight: normal; }
                    .num { text-align: right; }
                    .footer { margin-top: 15px; }
                    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; font-size: 11pt; }
                    .signature-line { display: flex; align-items: center; margin-top: 10px; }
                    .signature-line .label { white-space: nowrap; }
                    .signature-line .line { border-bottom: 1px solid #000; flex-grow: 1; margin: 0 10px; }
                    .signature-line .name { white-space: nowrap; }
                    .signature-note { font-size: 8pt; text-align: center; }
                    .print-button {
                        position: fixed;
                        top: 10px;
                        right: 10px;
                        padding: 10px 15px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 12pt;
                        font-family: sans-serif;
                    }
                    .service-cell {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    /* Specific styles for the footer to match the provided image */
                    .signatures-flex-container {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start; /* Align items to the top */
                        margin-top: 15px;
                    }
                    .left-signatures-column {
                        flex-basis: 45%; /* Adjusted width for left side */
                        display: flex;
                        flex-direction: column;
                        align-items: flex-start; /* Align contents to the left */
                        padding-left: 0; /* No extra padding */
                    }
                    .right-signatures-column {
                        flex-basis: 55%; /* Adjusted width for right side */
                        text-align: right; /* Align contents to the right */
                        padding-right: 0; /* No extra padding */
                    }
                    .signature-item {
                        margin-bottom: 15px; /* Spacing between signature blocks */
                        line-height: 1.2;
                    }
                    .signature-role-text {
                        white-space: nowrap;
                        margin-bottom: 3px;
                        text-align: inherit; /* Inherit text-align from parent */
                        font-size: 9pt; /* Adjust font size */
                    }
                    .signature-line-flex { /* New class for flex signature line */
                        display: flex;
                        align-items: flex-end;
                        justify-content: flex-start; /* Align to start for expert/chief */
                        margin-top: 0;
                        margin-bottom: 3px;
                        width: 100%; /* Take full width of its container */
                    }
                    .signature-line-flex .line {
                        border-bottom: 1px solid #000;
                        width: 150px; /* Fixed width for the line */
                        flex-grow: 0;
                        flex-shrink: 0;
                        margin: 0 5px;
                    }
                    .signature-line-flex.right-aligned {
                        justify-content: flex-end; /* Align to end for client */
                    }
                    
                    .signature-name {
                        white-space: nowrap;
                        line-height: 1.2;
                        text-align: inherit; /* Inherit text-align from parent */
                        font-size: 8pt; /* Adjust font size */
                        flex-shrink: 0;
                    }
        
                    /* Adjust font sizes as requested for customer label */
                    .signature-label-customer {
                        white-space: nowrap;
                        margin-right: 5px; /* Space between "Замовник" and the line */
                        font-size: 11pt; /* Based on previous request for role text */
                        flex-shrink: 0;
                    }
                    /* Ensure role text for expert/chief remains small */
                    .left-signatures-column .signature-role-text { font-size: 9pt; }
                    /* Ensure name for expert/chief remains small */
                    .left-signatures-column .signature-name { font-size: 8pt; }
        
                    .mp-container {
                        clear: both; /* Clear floats if any */
                        margin-top: 20px;
                        text-align: right; /* Changed from left to right for consistency */
                        padding-left: 0; /* Align with left column */
                        padding-right: 0; /* Added for consistency */
                        font-size: 10pt;
                    }
                    @media print {
                        @page {
                            size: A4;
                            margin: 2cm;
                        }
                        body {
                            padding: 0;
                            font-size: 10pt;
                        }
                        .container {
                            max-width: 100%;
                        }
                        .print-button {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <button class="print-button" onclick="window.print()">Роздрукувати</button>
                    <header class="header">
                        <h1>ЗАКАРПАТСЬКА ТОРГОВО-ПРОМИСЛОВА ПАЛАТА</h1>
                        <p>м. Ужгород, вул. Грушевського, 62а, тел. 66-94-50, факс 66-94-60</p>
                    </header>
    
                    <div class="flex order-title">
                        <div class="bold">НАРЯД №Д-${record.registrationNumber}</div>
                        <div style="flex-grow: 1;"></div>
                        <div>дата видачі ${formatDate(record.startDate)}</div>
                    </div>
    
                    <div class="flex section">
                        <div>Підстава для видачі наряду:</div>
                        <div style="flex-grow: 1;"></div>
                        <div>заявка №Д- ${record.registrationNumber} <span style="margin: 0 10px;">від</span> ${formatDate(record.startDate)}</div>
                    </div>
    
                    <div class="section">
                        Експерт <span class="bold">${record.expert}</span>
                    </div>
    
                     <div class="details-line section">
                        <div class="label">Організація-замовник:</div>
                        <div class="underline">${firm.name}, ${firm.address}</div>
                    </div>
    
                    <div class="edrpou-section">
                        <div class="edrpou-box">
                            <div class="value">${firm.edrpou}</div>
                            <div class="label">код ЄДРПОУ</div>
                        </div>
                        <div style="flex-basis: 30%;"></div>
                         <div class="edrpou-box">
                            <div class="value">${firm.taxNumber}</div>
                            <div class="label">Індивідуальний податковий номер (для платників ПДВ)</div>
                        </div>
                    </div>
                    
                    <div class="details-line section">
                        <div class="label">Назва продукції:</div>
                        <div class="underline">${firm.productName}</div>
                    </div>
                    <div class="details-line section">
                        <div class="label">Кількість:</div>
                        <div class="underline">${record.units}</div>
                    </div>
                     <div class="details-line section">
                        <div class="label">Місцезнаходження продукції:</div>
                        <div class="underline">складське приміщення замовника</div>
                    </div>
                    <div class="details-line section">
                        <div class="label">Завдання експертизи:</div>
                        <div class="underline" style="font-size: 9pt;">Аналіз витрат сировини, яка переробляється на митній території України, та вихід готової продукції</div>
                    </div>
                    <div class="flex section" style="align-items: flex-end; margin-top: 15px;">
                        <div>М.П.</div>
                        <div class="signature-line" style="flex-basis: 55%; margin-top: 0;">
                            <div class="label">Керівник підрозділу</div>
                            <div class="line"></div>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th rowspan="2" style="width: 4%;">№</th>
                                <th rowspan="2" style="width: 12%;">Код,згідно тарифу</th>
                                <th rowspan="2" style="width: 38%;">Вид послуг</th>
                                <th rowspan="2" style="width: 8%;"></th>
                                <th rowspan="2" style="width: 8%;"></th>
                                <th colspan="2">Вартість</th>
                            </tr>
                            <tr>
                                <th style="width: 15%;">повна</th>
                                <th style="width: 15%;">зі знижкою</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>&nbsp;</td>
                                <td style="text-align: center;">договірний</td>
                                <td>Аналіз витрат сировини, яка переробляється на митній території України</td>
                                <td></td>
                                <td></td>
                                <td class="num">${pageCost.toFixed(2)}</td>
                                <td class="num">${(pageCost * discountMultiplier).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                                <td><div class="service-cell"><span>підтвердження кодів згідно УКТЗЕД</span><span>${record.codes || 0} код</span></div></td>
                                <td></td>
                                <td></td>
                                <td class="num">${codeCostValue.toFixed(2)}</td>
                                <td class="num">${(codeCostValue * discountMultiplier).toFixed(2)}</td>
                            </tr>
                            ${emptyRowsHtml}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="5" class="num bold">Вартість, без ПДВ</td>
                                <td class="num bold">${sumWithoutDiscount.toFixed(2)}</td>
                                <td class="num bold">${sumWithDiscount.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colspan="6" class="num bold">ПДВ, 20%</td>
                                <td class="num bold">${vat.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colspan="6" class="num bold">ВСЬОГО:</td>
                                <td class="num bold">${totalWithVat.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
    
                    <footer class="footer">
                        <div class="signatures-flex-container">
                            <div class="left-signatures-column">
                                <div class="signature-item">
                                    <div class="signature-line-flex">
                                        <span class="signature-label-customer">Експерт</span>
                                        <span class="line"></span>
                                        <span class="signature-name">${record.expert}</span>
                                    </div>
                                    
                            </div>
                            <div class="signature-item" style="margin-top: 15px;">
                                <div class="signature-line-flex">
                                    <span class="signature-label-customer">Замовник</span>
                                    <span class="line"></span>
                                    <span class="signature-name">${firm.directorName}</span>
                                </div>
                            </div>
                        </div>

                        <div class="right-signatures-column">
                            <div class="signature-item">
                                <div class="signature-line" style="justify-content: flex-end; width: 100%;">
                                    <div class="label">Керівник підрозділу</div>
                                    <div class="line"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mp-container">М.П.</div>
                </footer>
            </div>
        </body>
        </html>
    `;
    } else { // --- Standard Conclusion Logic ---
        let tableRowsHtml = '';
        const serviceRows = [];

        serviceRows.push(`
            <tr>
                <td>&nbsp;</td>
                <td>IV. 1-a</td>
                <td>Аналіз витрат сировини, яка переробляється на<br>а)легка промисловість</td>
                <td class="num">${record.models} мод</td>
                <td class="num">${record.positions} поз</td>
                <td class="num">${modelCost.toFixed(2)}</td>
                <td class="num">${(modelCost * discountMultiplier).toFixed(2)}</td>
            </tr>
        `);
        
        serviceRows.push(`
            <tr>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>б) підтвердження кодів згідно УКТЗЕД</td>
                <td class="num">${record.codes} код</td>
                <td class="num">&nbsp;</td>
                <td class="num">${codeCostValue.toFixed(2)}</td>
                <td class="num">${(codeCostValue * discountMultiplier).toFixed(2)}</td>
            </tr>
        `);

        if (complexityCost > 0) {
            serviceRows.push(`
                <tr>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>за модельні особливості та складності роботи</td>
                    <td class="num">&nbsp;</td>
                    <td class="num">&nbsp;</td>
                    <td class="num">${complexityCost.toFixed(2)}</td>
                    <td class="num">${(complexityCost * discountMultiplier).toFixed(2)}</td>
                </tr>`);
        }
        if (urgencyCost > 0) {
            serviceRows.push(`
                <tr>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>за терміновість</td>
                    <td class="num">&nbsp;</td>
                    <td class="num">&nbsp;</td>
                    <td class="num">${urgencyCost.toFixed(2)}</td>
                    <td class="num">${(urgencyCost * discountMultiplier).toFixed(2)}</td>
                </tr>`);
        }
        
        const totalServiceRows = serviceRows.length;
        for (let i = 0; i < (8 - totalServiceRows); i++) {
            serviceRows.push(`
                <tr>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                </tr>
            `);
        }
        tableRowsHtml = serviceRows.join('');

        return `
            <!DOCTYPE html>
            <html lang="uk">
            <head>
                <meta charset="UTF-8">
                <title>Наряд №Д-${record.registrationNumber}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
                    body {
                        font-family: 'Times New Roman', serif;
                        font-size: 11pt;
                        margin: 0;
                        padding: 20px;
                        line-height: 1.4;
                        background: #fff;
                        color: #000;
                    }
                    .container {
                        max-width: 18cm;
                        margin: auto;
                    }
                    .header { text-align: center; }
                    .header h1 { font-size: 11pt; margin: 0; font-weight: bold; }
                    .header p { font-size: 10pt; margin: 0; }
                    .order-title { margin-top: 15px; }
                    .bold { font-weight: bold; }
                    .section { margin-top: 8px; }
                    .flex { display: flex; justify-content: space-between; align-items: flex-end; }
                    .underline {
                        border-bottom: 1px solid #000;
                        flex-grow: 1;
                        margin: 0 5px;
                        text-align: center;
                        font-weight: bold;
                    }
                    .edrpou-section { display: flex; gap: 20px; margin-top: 10px; }
                    .edrpou-box { border: 1px solid #000; padding: 2px 5px; text-align: center; flex-basis: 35%; }
                    .edrpou-box .value { font-size: 11pt; font-weight: bold; }
                        .edrpou-box .label { font-size: 8pt; }
                    .details-line { display: flex; align-items: flex-end; margin-top: 8px; }
                    .details-line .label { white-space: nowrap; }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                        font-size: 9pt;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 4px;
                        text-align: left;
                        vertical-align: top;
                    }
                    th { text-align: center; font-weight: normal; }
                    .num { text-align: right; }
                    .footer { margin-top: 15px; }
                    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; font-size: 11pt; }
                    .signature-line { display: flex; align-items: center; margin-top: 10px; }
                    .signature-line .label { white-space: nowrap; }
                    .signature-line .line { border-bottom: 1px solid #000; flex-grow: 1; margin: 0 10px; }
                    .signature-line .name { white-space: nowrap; }
                    .signature-note { font-size: 8pt; text-align: center; }
                    .print-button {
                        position: fixed;
                        top: 10px;
                        right: 10px;
                        padding: 10px 15px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 12pt;
                        font-family: sans-serif;
                    }
                     /* Specific styles for the footer to match the provided image */
                     .signatures-flex-container {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start; /* Align items to the top */
                        margin-top: 15px;
                    }
                    .left-signatures-column {
                        flex-basis: 45%; /* Adjusted width for left side */
                        display: flex;
                        flex-direction: column;
                        align-items: flex-start; /* Align contents to the left */
                        padding-left: 0; /* No extra padding */
                    }
                    .right-signatures-column {
                        flex-basis: 55%; /* Adjusted width for right side */
                        text-align: right; /* Align contents to the right */
                        padding-right: 0; /* No extra padding */
                    }
                    .signature-item {
                        margin-bottom: 15px; /* Spacing between signature blocks */
                        line-height: 1.2;
                    }
                    .signature-role-text {
                        white-space: nowrap;
                        margin-bottom: 3px;
                        text-align: inherit; /* Inherit text-align from parent */
                        font-size: 9pt; /* Adjust font size */
                    }
                    .signature-line-flex { /* New class for flex signature line */
                        display: flex;
                        align-items: flex-end;
                        justify-content: flex-start; /* Align to start for expert/chief */
                        margin-top: 0;
                        margin-bottom: 3px;
                        width: 100%; /* Take full width of its container */
                    }
                    .signature-line-flex .line {
                        border-bottom: 1px solid #000;
                        width: 150px; /* Fixed width for the line */
                        flex-grow: 0;
                        flex-shrink: 0;
                        margin: 0 5px;
                    }
                    .signature-line-flex.right-aligned {
                        justify-content: flex-end; /* Align to end for client */
                    }
                    
                    .signature-name {
                        white-space: nowrap;
                        line-height: 1.2;
                        text-align: inherit; /* Inherit text-align from parent */
                        font-size: 8pt; /* Adjust font size */
                        flex-shrink: 0;
                    }
        
                    /* Adjust font sizes as requested for customer label */
                    .signature-label-customer {
                        white-space: nowrap;
                        margin-right: 5px; /* Space between "Замовник" and the line */
                        font-size: 11pt; /* Based on previous request for role text */
                        flex-shrink: 0;
                    }
                    /* Ensure role text for expert/chief remains small */
                    .left-signatures-column .signature-role-text { font-size: 9pt; }
                    /* Ensure name for expert/chief remains small */
                    .left-signatures-column .signature-name { font-size: 8pt; }
        
                    .mp-container {
                        clear: both; /* Clear floats if any */
                        margin-top: 20px;
                        text-align: right; /* Changed from left to right for consistency */
                        padding-left: 0; /* Align with left column */
                        padding-right: 0; /* Added for consistency */
                        font-size: 10pt;
                    }
                    @media print {
                        @page {
                            size: A4;
                            margin: 2cm;
                        }
                        body {
                            padding: 0;
                            font-size: 10pt;
                        }
                        .container {
                            max-width: 100%;
                        }
                        .print-button {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <button class="print-button" onclick="window.print()">Роздрукувати</button>
                    <header class="header">
                        <h1>ЗАКАРПАТСЬКА ТОРГОВО-ПРОМИСЛОВА ПАЛАТА</h1>
                        <p>м. Ужгород, вул. Грушевського, 62а, тел. 66-94-50, факс 66-94-60</p>
                    </header>

                    <div class="flex order-title">
                        <div class="bold">НАРЯД №Д-${record.registrationNumber}</div>
                        <div style="flex-grow: 1;"></div>
                        <div>дата видачі ${formatDate(record.startDate)}</div>
                    </div>

                    <div class="flex section">
                        <div>Підстава для видачі наряду:</div>
                        <div style="flex-grow: 1;"></div>
                        <div>заявка №Д-${record.registrationNumber} <span style="margin: 0 10px;">від</span> ${formatDate(record.startDate)}</div>
                    </div>

                    <div class="section">
                        Експерт <span class="bold">${record.expert}</span>
                    </div>

                     <div class="details-line section">
                        <div class="label">Організація-замовник:</div>
                        <div class="underline">${firm.name}, ${firm.address}</div>
                    </div>

                    <div class="edrpou-section">
                        <div class="edrpou-box">
                            <div class="value">${firm.edrpou}</div>
                            <div class="label">код ЄДРПОУ</div>
                        </div>
                        <div style="flex-basis: 30%;"></div>
                         <div class="edrpou-box">
                            <div class="value">${firm.taxNumber}</div>
                            <div class="label">Індивідуальний податковий номер (для платників ПДВ)</div>
                        </div>
                    </div>
                    
                    <div class="details-line section">
                        <div class="label">Назва продукції:</div>
                        <div class="underline">${firm.productName}</div>
                    </div>
                    <div class="details-line section">
                        <div class="label">Кількість:</div>
                        <div class="underline">${record.units}</div>
                    </div>
                     <div class="details-line section">
                        <div class="label">Місцезнаходження продукції:</div>
                        <div class="underline">складське приміщення замовника</div>
                    </div>
                    <div class="details-line section">
                        <div class="label">Завдання експертизи:</div>
                        <div class="underline" style="font-size: 9pt;">Аналіз витрат сировини, яка переробляється на митній території України, та вихід готової продукції</div>
                    </div>
                    <div class="flex section" style="align-items: flex-end; margin-top: 15px;">
                        <div>М.П.</div>
                        <div class="signature-line" style="flex-basis: 55%; margin-top: 0;">
                            <div class="label">Керівник підрозділу</div>
                            <div class="line"></div>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th rowspan="2" style="width: 4%;">№</th>
                                <th rowspan="2" style="width: 12%;">Код,згідно тарифу</th>
                                <th rowspan="2" style="width: 38%;">Вид послуг</th>
                                <th rowspan="2" style="width: 8%;"></th>
                                <th rowspan="2" style="width: 8%;"></th>
                                <th colspan="2">Вартість</th>
                            </tr>
                            <tr>
                                <th style="width: 15%;">повна</th>
                                <th style="width: 15%;">зі знижкою</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRowsHtml}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="5" class="num bold">Вартість, без ПДВ</td>
                                <td class="num bold">${sumWithoutDiscount.toFixed(2)}</td>
                                <td class="num bold">${sumWithDiscount.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colspan="6" class="num bold">ПДВ, 20%</td>
                                <td class="num bold">${vat.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colspan="6" class="num bold">ВСЬОГО:</td>
                                <td class="num bold">${totalWithVat.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <footer class="footer">
                        <div class="signatures-flex-container">
                            <div class="left-signatures-column">
                                <div class="signature-item">
                                    <div class="signature-line-flex">
                                        <span class="signature-label-customer">Експерт</span>
                                        <span class="line"></span>
                                        <span class="signature-name">${record.expert}</span>
                                    </div>
                                    
                                </div>
                                <div class="signature-item" style="margin-top: 15px;">
                                    <div class="signature-line-flex">
                                        <span class="signature-label-customer">Замовник</span>
                                        <span class="line"></span>
                                        <span class="signature-name">${firm.directorName}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="right-signatures-column">
                                <div class="signature-item">
                                    <div class="signature-line" style="justify-content: flex-end; width: 100%;">
                                        <div class="label">Керівник підрозділу</div>
                                        <div class="line"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mp-container">М.П.</div>
                    </footer>
                </div>
            </body>
            </html>
        `;
    }
};

export const generateCertificateOrderHtml = (record: AppRecord, firm: Firm, generalSettings: GeneralSettings): string => {
    // FIX: Call calculateCost to get all necessary cost components for certificates.
    const {
        sumWithoutDiscount, 
        urgentMainCertCost, urgentPositionsCost, urgentAdditionalPagesCost
    } = calculateCost({
        positions: record.positions,
        urgency: record.urgency,
        units: record.units,
        pages: record.pages,
        additionalPages: record.additionalPages,
        productionType: record.productionType,
        certificateServiceType: record.certificateServiceType,
    }, [], generalSettings, 'certificates');

    const vat = sumWithoutDiscount * 0.2;
    const totalToPay = sumWithoutDiscount + vat;

    const formatNum = (num: number) => num.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatDateSimple = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
        return `${String(adjustedDate.getDate()).padStart(2, '0')}.${String(adjustedDate.getMonth() + 1).padStart(2, '0')}.${adjustedDate.getFullYear()}`;
    };
    const formattedStartDateLong = formatDate(record.startDate); 
    const urgencyTariffText = record.urgency ? 'терміновий' : 'звичайний';


    return `
    <!DOCTYPE html>
    <html lang="uk">
    <head>
        <meta charset="UTF-8">
        <title>Наряд №${record.registrationNumber}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
            body { font-family: 'Times New Roman', serif; font-size: 10pt; margin: 0; background: #fff; color: #000; -webkit-print-color-adjust: exact; }
            .container { width: 18cm; margin: auto; padding-top: 20px; }
            .header { text-align: center; font-weight: bold; text-decoration: underline; padding-bottom: 10px; font-size: 11pt; }
            .order-info { display: grid; grid-template-columns: 1fr 1.2fr 1fr; align-items: center; margin-top: 15px; padding-bottom: 10px; }
            .order-info .center { text-align: center; }
            .order-info .center .underline-value { border-bottom: 1px solid #000; display: inline-block; padding: 0 5px; }
            .order-info .right { text-align: right; }
            .details { margin-top: 15px; font-size: 10pt; }
            .details-line { display: flex; align-items: flex-end; margin-top: 8px; }
            .details-line .label { white-space: nowrap; padding-right: 5px; }
            .details-line .value { border-bottom: 1px solid #000; flex-grow: 1; text-align: center; font-weight: bold; padding: 0 5px; }
            .details-line.task { margin-top: 15px; }
            .section-title { font-weight: bold; text-align: center; margin-top: 20px; font-size: 10pt; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 7.5pt; table-layout: fixed; border: 2px solid #000; }
            th, td { border: 1px solid #000; padding: 3px; text-align: center; vertical-align: middle; word-wrap: break-word; }
            th { font-weight: normal; }
            .num { text-align: right; }
            .footer { margin-top: 25px; font-size: 10pt; }
            .print-button { position: fixed; top: 10px; right: 10px; padding: 10px 15px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-family: sans-serif; }
            @media print {
                body { padding: 0; font-size: 9pt; }
                .container { margin: 0; border: none; width: 100%; padding: 0; }
                .print-button { display: none; }
                @page { size: A4 portrait; margin: 1.5cm; }
                /* Adjust footer font size for print */
                .footer { font-size: 8.5pt; } 
            }
            
            /* Footer signature container */
            .signatures-container {
                display: flex;
                justify-content: space-between;
                align-items: flex-start; /* Align items to the top */
                margin-top: 15px;
            }
            .left-signatures {
                flex-basis: 45%; /* Adjusted width for left side */
                display: flex;
                flex-direction: column;
                align-items: flex-start; /* Align contents to the left */
                padding-left: 0; /* No extra padding */
            }
            .right-signatures {
                flex-basis: 55%; /* Adjusted width for right side */
                text-align: right; /* Align contents to the right */
                padding-right: 0; /* No extra padding */
            }
            .signature-block {
                margin-bottom: 15px; /* Spacing between signature blocks */
                line-height: 1.2;
            }
            .signature-role {
                white-space: nowrap;
                margin-bottom: 3px;
                text-align: inherit; /* Inherit text-align from parent */
                font-size: 9pt; /* For left-signatures column role text */
            }
            .signature-line-flex { /* New class for flex signature line */
                display: flex;
                align-items: flex-end;
                justify-content: flex-start; /* Default to left-aligned */
                margin-top: 0;
                margin-bottom: 3px;
                width: 100%; /* Take full width of its container */
            }
            .signature-line-flex .line {
                border-bottom: 1px solid #000;
                width: 150px; /* Fixed width for the line */
                flex-grow: 0;
                flex-shrink: 0;
                margin: 0 5px;
            }
            .signature-line-flex.right-aligned {
                justify-content: flex-end; /* Align to end for client */
            }
            
            .signature-name {
                white-space: nowrap;
                line-height: 1.2;
                text-align: inherit; /* Inherit text-align from parent */
                font-size: 8pt; /* For left-signatures column name */
                flex-shrink: 0;
            }

            /* Adjust font sizes as requested for customer label */
            .signature-label-customer {
                white-space: nowrap;
                margin-right: 5px; /* Space between "Замовник" and the line */
                font-size: 11pt; /* Based on previous request for role text */
                flex-shrink: 0;
            }
            /* Ensure role text for expert/chief remains small */
            .left-signatures .signature-role { font-size: 9pt; }
            /* Ensure name for expert/chief remains small */
            .left-signatures .signature-name { font-size: 8pt; }


            .mp-container {
                clear: both; /* Clear floats if any */
                margin-top: 20px;
                text-align: right; /* Changed from left to right */
                padding-left: 0;
                padding-right: 0; /* Added for consistency */
                font-size: 10pt;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <button class="print-button" onclick="window.print()">Роздрукувати</button>
            <div class="header">ЗАКАРПАТСЬКА ТОРГОВО-ПРОМИСЛОВА ПАЛАТА</div>
            <div class="order-info">
                <div><b>НАРЯД №${record.registrationNumber}</b></div>
                <div class="center"><span class="underline-value">${formattedStartDateLong}</span></div>
                <div class="right"><b>Експерт:</b> ${record.expert}</div>
            </div>
            <div class="details">
                <div class="details-line">
                    <div class="label">Замовник (платник), адреса:</div>
                    <div class="value">${firm.name}, ${firm.address}</div>
                </div>
                <div class="details-line task" style="margin-top: 15px;">
                    <div class="label">Завдання експертизи:</div>
                    <div class="value">оформлення та засвідчення сертифікатів походження товарів</div>
                </div>
            </div>
            <div class="section-title">ВІДМІТКА ЗАМОВНИКА ПРО ПРОВЕДЕННЯ ЕКСПЕРТИЗИ</div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 9%;">Дата<br>проведення</th>
                        <th style="width: 10%;">Форма<br>сертифікату</th>
                        <th style="width: 8%;">Кількість<br>серти-<br>катів</th>
                        <th style="width: 9%;">тариф</th>
                        <th style="width: 9%;">Вартість<br>сертифікату<br>(грн)</th>
                        <th style="width: 9%;">Кількість дод.<br>товар. позицій</th>
                        <th style="width: 8%;">Вартість дод.<br>тов. поз. (грн)</th>
                        <th style="6%;">Кількість<br>дод.<br>аркушів</th>
                        <th style="8%;">Вартість<br>дод.<br>арк. (грн)</th>
                        <th style="9%;">Сума, грн</th>
                        <th style="8%;">ПДВ (20%),<br>грн</th>
                        <th style="9%;">Всього до<br>сплати, грн</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${formatDateSimple(record.endDate)}</td>
                        <td>${record.certificateForm || ''}</td>
                        <td>${record.units}</td>
                        <td>${urgencyTariffText}</td>
                        <td>${formatNum(urgentMainCertCost)}</td>
                        <td>${record.positions > 0 ? record.positions : ''}</td>
                        <td>${urgentPositionsCost > 0 ? formatNum(urgentPositionsCost) : ''}</td>
                        <td>${record.additionalPages > 0 ? record.additionalPages : ''}</td>
                        <td>${urgentAdditionalPagesCost > 0 ? formatNum(urgentAdditionalPagesCost) : ''}</td>
                        <td>${formatNum(sumWithoutDiscount)}</td>
                        <td>${formatNum(vat)}</td>
                        <td>${formatNum(totalToPay)}</td>
                    </tr>
                </tbody>
            </table>
            <div class="footer">
                <div class="signatures-container">
                    <div class="left-signatures">
                        <div class="signature-block">
                            <div class="signature-line-flex">
                                <span class="signature-label-customer">Експерт</span>
                                <span class="line"></span>
                                <span class="signature-name">${record.expert}</span>
                            </div>
                        </div>
                        <div class="signature-block" style="margin-top: 15px;">
                            <div class="signature-line-flex">
                                <span class="signature-label-customer">Нач. відділу</span>
                                <span class="line"></span>
                                <span class="signature-name">Снєтков С.Ю.</span>
                            </div>
                        </div>
                    </div>

                    <div class="right-signatures">
                        <div class="signature-block">
                            <div class="signature-line-flex right-aligned">
                                <span class="signature-name">${firm.directorName}</span>
                                <span class="line"></span>
                                <span class="signature-label-customer">Замовник</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mp-container">М.П.</div>
            </div>
        </div>
    </body>
    </html>
    `;
};

export const generateFirmsHtml = (firms: Firm[], activeMode: 'conclusions' | 'certificates'): string => {
    const modeTitle = activeMode === 'conclusions' ? 'експертних висновків' : 'сертифікатів походження';
    const documentTitle = `Список фірм для ${modeTitle}`;

    const firmRows = firms.map((firm, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${firm.name}</td>
            <td>${firm.productName}</td>
            <td>${firm.address}</td>
            <td>${firm.directorName}</td>
            <td>${firm.edrpou}</td>
            <td>${firm.taxNumber}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html lang="uk">
        <head>
            <meta charset="UTF-8">
            <title>${documentTitle}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
                body {
                    font-family: 'Roboto', sans-serif;
                    font-size: 10pt;
                    margin: 20px;
                }
                .container {
                    width: 100%;
                    margin: auto;
                }
                h1 {
                    text-align: center;
                    font-size: 14pt;
                    margin-bottom: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                    font-size: 9pt;
                }
                th, td {
                    border: 1px solid #333;
                    padding: 5px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .print-button {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    padding: 8px 12px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 10pt;
                }
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 1.5cm;
                    }
                    body {
                        margin: 0;
                        font-size: 9pt;
                    }
                    .print-button {
                        display: none;
                    }
                    h1 {
                        font-size: 12pt;
                    }
                    table {
                        font-size: 8pt;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <button class="print-button" onclick="window.print()">Роздрукувати</button>
                <h1>${documentTitle}</h1>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 3%;">№</th>
                            <th style="width: 18%;">Назва фірми</th>
                            <th style="width: 15%;">Найменування товару</th>
                            <th style="width: 20%;">Адреса</th>
                            <th style="width: 14%;">ПІБ директора</th>
                            <th style="width: 10%;">ЄДРПОУ</th>
                            <th style="width: 20%;">ІПН</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${firmRows}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `;
};

export const generateRecordsHtml = (records: (AppRecord & { sumWithoutDiscount: number, sumWithDiscount: number })[], activeMode: 'conclusions' | 'certificates'): string => {
    const isConclusions = activeMode === 'conclusions';
    const modeTitle = isConclusions ? 'експертних висновків' : 'сертифікатів походження';
    const documentTitle = `Список ${modeTitle}`;

    const formatDateForPrint = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            const userTimezoneOffset = date.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
            const day = String(adjustedDate.getDate()).padStart(2, '0');
            const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
            const year = adjustedDate.getFullYear();
            return `${day}.${month}.${year}`;
        } catch (error) {
            return dateStr;
        }
    };
    
    const formatCurrencyForPrint = (value: number) => {
        return new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + ' грн';
    };
    
    const headers = ['№', 'Реєстр. №', 'Дата', 'Акт', 'Назва компанії', 'Коментар', 'Сума', 'Експерт'];
    
    const headerHtml = headers.map(h => `<th>${h}</th>`).join('');

    const recordRows = records.map((record, index) => {
        const sum = isConclusions ? record.sumWithDiscount : record.sumWithoutDiscount;
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${record.registrationNumber}</td>
                <td>${formatDateForPrint(record.endDate)}</td>
                <td>${record.actNumber || '-'}</td>
                <td>${record.companyName}</td>
                <td>${record.comment || '-'}</td>
                <td>${sum.toFixed(2)}</td>
                <td>${record.expert}</td>
            </tr>
        `;
    }).join('');

    return `
        <!DOCTYPE html>
        <html lang="uk">
        <head>
            <meta charset="UTF-8">
            <title>${documentTitle}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
                body { font-family: 'Roboto', sans-serif; font-size: 10pt; margin: 20px; }
                .container { width: 100%; margin: auto; }
                h1 { text-align: center; font-size: 14pt; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; font-size: 9pt; }
                th, td { border: 1px solid #333; padding: 5px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .print-button { position: fixed; top: 10px; right: 10px; padding: 8px 12px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 10pt; }
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 1.5cm;
                    }
                    body { margin: 0; font-size: 9pt; }
                    .print-button { display: none; }
                    h1 { font-size: 12pt; }
                    table { font-size: 8pt; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <button class="print-button" onclick="window.print()">Роздрукувати</button>
                <h1>${documentTitle}</h1>
                <table>
                    <thead>
                        <tr>${headerHtml}</tr>
                    </thead>
                    <tbody>
                        ${recordRows}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `;
};


export const generateMonthlyReportHtml = (
    allRecords: AppRecord[],
    firms: Firm[],
    costModelTable: CostModelRow[],
    generalSettings: GeneralSettings,
    selectedMonth: string,
    activeMode: AppMode
): string => {
    const isConclusions = activeMode === 'conclusions';
    const reportType = isConclusions ? 'ЕКСПЕРТИЗИ' : 'СЕРТИФІКАТІВ';
    const monthNames = [
        'січень', 'лютий', 'березень', 'квітень', 'травень', 'червень',
        'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'
    ];
    const [year, monthIndexStr] = selectedMonth.split('-');
    const monthName = monthNames[parseInt(monthIndexStr, 10) - 1];
    const reportTitle = `ЗВІТ ${reportType} ЗА ${monthName.toUpperCase()} ${year} РІК`;

    const recordsWithCost = allRecords
        .filter(record => record.endDate.substring(0, 7) === selectedMonth)
        .map(record => {
            const costData = {
                models: record.models,
                positions: record.positions,
                codes: record.codes,
                complexity: record.complexity,
                urgency: record.urgency,
                discount: record.discount,
                pages: record.pages,
                additionalPages: record.additionalPages,
                units: record.units,
                productionType: record.productionType,
                certificateServiceType: record.certificateServiceType,
                conclusionType: record.conclusionType,
            };
            const { sumWithoutDiscount, sumWithDiscount } = calculateCost(costData, costModelTable, generalSettings, activeMode);
            const sum = isConclusions ? sumWithDiscount : sumWithoutDiscount;
            return { ...record, calculatedSum: sum };
        })
        .sort((a, b) => {
            // Sort by expert, then by company name, then by end date
            if (a.expert < b.expert) return -1;
            if (a.expert > b.expert) return 1;
            if (a.companyName < b.companyName) return -1;
            if (a.companyName > b.companyName) return 1;
            return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        });

    const groupedByExpert: { 
        [expertName: string]: { 
            totalRecordsCount: number; // New field for conclusion count
            totalUnits: number; 
            totalSum: number; 
            firms: { 
                [firmName: string]: { 
                    totalRecordsCount: number; // New field for conclusion count
                    totalUnits: number; 
                    totalSum: number; 
                    records: (AppRecord & { calculatedSum: number })[] 
                } 
            } 
        } 
    } = {};

    recordsWithCost.forEach(record => {
        if (!groupedByExpert[record.expert]) {
            groupedByExpert[record.expert] = { totalRecordsCount: 0, totalUnits: 0, totalSum: 0, firms: {} };
        }
        if (!groupedByExpert[record.expert].firms[record.companyName]) {
            groupedByExpert[record.expert].firms[record.companyName] = { totalRecordsCount: 0, totalUnits: 0, totalSum: 0, records: [] };
        }

        groupedByExpert[record.expert].firms[record.companyName].records.push(record);
        
        // Conditional logic for units/record count
        if (isConclusions) {
            groupedByExpert[record.expert].firms[record.companyName].totalRecordsCount += 1;
            groupedByExpert[record.expert].totalRecordsCount += 1;
        } else {
            groupedByExpert[record.expert].firms[record.companyName].totalUnits += record.units;
            groupedByExpert[record.expert].totalUnits += record.units;
        }
        groupedByExpert[record.expert].firms[record.companyName].totalSum += record.calculatedSum;
        groupedByExpert[record.expert].totalSum += record.calculatedSum;
    });

    let tableRowsHtml = '';
    let grandTotalOverallUnitsOrRecords = 0; // Renamed to be generic
    let grandTotalSum = 0;

    Object.keys(groupedByExpert).sort().forEach(expertName => {
        const expertData = groupedByExpert[expertName];

        Object.keys(expertData.firms).sort().forEach(firmName => {
            const firmData = expertData.firms[firmName];
            
            const isSingleRecordFirm = firmData.records.length === 1;
            const firmRowspan = firmData.records.length;

            firmData.records.forEach((record, recordIndex) => {
                const numericRegNumber = record.registrationNumber.match(/(\d+)/)?.[1] || record.registrationNumber;
                
                tableRowsHtml += `
                    <tr>
                        ${recordIndex === 0 ? `<td rowspan="${firmRowspan}" class="firm-name">${firmName}</td>` : ''}
                        <td class="reg-num">${numericRegNumber}</td>
                        <td class="units">${isConclusions ? '1' : record.units}</td>
                        <td class="date">${formatDateForReport(record.endDate)}</td>
                        <td class="sum">${formatCurrencyForReport(record.calculatedSum)}</td>
                    </tr>
                `;
            });

            // Firm totals - only add if there's more than one record
            if (!isSingleRecordFirm) {
                tableRowsHtml += `
                    <tr class="firm-total">
                        <td></td>
                        <td></td>
                        <td class="total-units-firm">${isConclusions ? firmData.totalRecordsCount : firmData.totalUnits}</td>
                        <td></td>
                        <td class="total-sum-firm">${formatCurrencyForReport(firmData.totalSum)}</td>
                    </tr>
                `;
            } 
        });

        // Expert totals
        tableRowsHtml += `
            <tr class="expert-total">
                <td colspan="2" class="expert-name">Всього: <span class="expert-value">${expertName}</span></td>
                <td class="expert-total-units">${isConclusions ? expertData.totalRecordsCount : expertData.totalUnits}</td>
                <td></td>
                <td class="expert-total-sum">${formatCurrencyForReport(expertData.totalSum)}</td>
            </tr>
        `;
        grandTotalOverallUnitsOrRecords += isConclusions ? expertData.totalRecordsCount : expertData.totalUnits;
        grandTotalSum += expertData.totalSum;
    });

    return `
        <!DOCTYPE html>
        <html lang="uk">
        <head>
            <meta charset="UTF-8">
            <title>${reportTitle}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
                body {
                    font-family: 'Times New Roman', serif;
                    font-size: 9pt;
                    margin: 20px;
                    background: #fff;
                    color: #000;
                    -webkit-print-color-adjust: exact;
                }
                .container {
                    width: 19cm; /* Adjusted width to fit A4 */
                    margin: auto;
                    border: none;
                }
                h1 {
                    text-align: center;
                    font-size: 12pt;
                    font-weight: bold;
                    margin-bottom: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                    font-size: 9pt;
                }
                th, td {
                    border: 1px solid #000;
                    padding: 3px 5px;
                    text-align: left;
                    vertical-align: top;
                }
                th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                    text-align: center;
                }
                .firm-name {
                    font-weight: bold;
                    vertical-align: middle;
                    text-align: left;
                    font-size: 10pt;
                }
                .reg-num { text-align: left; }
                .units { text-align: center; }
                .date { text-align: left; }
                .sum { text-align: right; }

                .firm-total td {
                    background-color: #e0e0e0;
                    font-weight: bold;
                    text-align: right;
                    font-size: 10pt;
                }
                .firm-total .total-units-firm {
                    text-align: center;
                }

                .expert-total td {
                    background-color: #c0c0c0;
                    font-weight: bold;
                    font-size: 10pt;
                    color: darkblue; /* Changed color to darkblue */
                }
                .expert-total .expert-name {
                    text-align: left;
                }
                .expert-total .expert-value {
                    text-decoration: underline;
                    color: blue; /* Example: to make it stand out */
                }
                .expert-total .expert-total-units {
                    text-align: center;
                }
                .expert-total .expert-total-sum {
                    text-align: right;
                }
                
                .grand-total td {
                    background-color: #a0a0a0;
                    font-weight: bold;
                    font-size: 10pt;
                    text-align: right;
                }
                .grand-total .grand-label {
                    text-align: left;
                }
                .grand-total .grand-units {
                    text-align: center;
                }

                .print-button {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    padding: 8px 12px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 10pt;
                }
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 1.5cm;
                    }
                    body {
                        margin: 0;
                        font-size: 8pt;
                    }
                    .print-button {
                        display: none;
                    }
                    h1 {
                        font-size: 11pt;
                    }
                    table {
                        font-size: 8pt;
                    }
                    th, td {
                        padding: 2px 4px;
                    }
                    .firm-name, .firm-total td, .expert-total td, .grand-total td {
                        font-size: 9pt;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <button class="print-button" onclick="window.print()">Роздрукувати</button>
                <h1>${reportTitle}</h1>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 25%;">Замовник</th>
                            <th style="width: 15%;">№ наряду</th>
                            <th style="width: 10%;">Кількість</th>
                            <th style="width: 20%;">Дата видачі</th>
                            <th style="width: 30%;">Сума, грн</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                        <tr class="grand-total">
                            <td colspan="2" class="grand-label">Всього за ${monthName} ${year} Рік:</td>
                            <td class="grand-units">${grandTotalOverallUnitsOrRecords}</td>
                            <td></td>
                            <td class="grand-sum">${formatCurrencyForReport(grandTotalSum)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `;
};

export const generateJournalHtml = (
    records: (AppRecord & { sumWithoutDiscount: number, sumWithDiscount: number })[],
    firms: Firm[],
    activeMode: AppMode
): string => {
    const isConclusions = activeMode === 'conclusions';
    const reportTitle = isConclusions ? 'ЖУРНАЛ РЕЄСТРАЦІЇ ЕКСПЕРТНИХ ВИСНОВКІВ' : 'ЖУРНАЛ РЕЄСТРАЦІЇ СЕРТИФІКАТІВ ПОХОДЖЕННЯ';

    const formatDateForJournal = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            const userTimezoneOffset = date.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
            const day = String(adjustedDate.getDate()).padStart(2, '0');
            const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
            const year = adjustedDate.getFullYear();
            return `${day}.${month}.${year}`;
        } catch (error) {
            return dateStr;
        }
    };

    const formatCurrencyForJournal = (value: number) => {
        return new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    };

    const sortedRecords = [...records].sort((a, b) => {
        const parseRegNumber = (numStr: string) => {
            const match = numStr.match(/(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
        };
        return parseRegNumber(a.registrationNumber) - parseRegNumber(b.registrationNumber);
    });

    const journalRows = sortedRecords.map((record, index) => {
        const firm = firms.find(f => f.name === record.companyName);
        const productName = firm ? firm.productName : '';
        const quantity = isConclusions ? 1 : record.units;
        const amountToPay = isConclusions ? record.sumWithDiscount : record.sumWithoutDiscount;

        return `
            <tr>
                <td>${record.registrationNumber}</td>
                <td>${formatDateForJournal(record.startDate)}</td>
                <td>${formatDateForJournal(record.endDate)}</td>
                <td>${record.companyName}</td>
                <td>${quantity}</td>
                <td>${productName}</td>
                <td>${record.expert}</td>
                <td>${formatCurrencyForJournal(amountToPay)}</td>
                <td></td>
            </tr>
        `;
    }).join('');

    return `
        <!DOCTYPE html>
        <html lang="uk">
        <head>
            <meta charset="UTF-8">
            <title>${reportTitle}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
                body {
                    font-family: 'Times New Roman', serif;
                    font-size: 9pt;
                    margin: 20px;
                    background: #fff;
                    color: #000;
                    -webkit-print-color-adjust: exact;
                }
                .container {
                    width: 100%;
                    margin: auto;
                }
                h1 {
                    text-align: center;
                    font-size: 12pt;
                    font-weight: bold;
                    margin-bottom: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                    font-size: 8pt;
                }
                th, td {
                    border: 1px solid #000;
                    padding: 3px 5px;
                    text-align: left;
                    vertical-align: top;
                }
                th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                    text-align: center;
                }
                .print-button {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    padding: 8px 12px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 10pt;
                }
                @media print {
                    @page {
                        size: A4 portrait; /* Set to portrait */
                        margin: 1.5cm;
                    }
                    body {
                        margin: 0;
                        font-size: 8pt;
                    }
                    .print-button {
                        display: none;
                    }
                    h1 {
                        font-size: 11pt;
                    }
                    table {
                        font-size: 7pt;
                    }
                    th, td {
                        padding: 2px 4px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <button class="print-button" onclick="window.print()">Роздрукувати</button>
                <h1>${reportTitle}</h1>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 10%;">№</th>
                            <th style="width: 10%;">Дата початку</th>
                            <th style="width: 10%;">Дата видачі</th>
                            <th style="width: 20%;">Найменування фірми</th>
                            <th style="5%;">Кількість</th>
                            <th style="width: 15%;">Назва товару</th>
                            <th style="width: 10%;">ПІБ експерта</th>
                            <th style="width: 10%;">Сума до оплати</th>
                            <th style="width: 10%;">Підпис замовника</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${journalRows}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `;
};