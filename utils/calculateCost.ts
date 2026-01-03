
import type { Record as AppRecord, CostModelRow, GeneralSettings, YearSettings } from '../types';
import type { AppMode } from '../App';

interface CostCalculationData {
    // For conclusions
    models?: number;
    codes?: number;
    complexity?: boolean;
    discount?: string;
    conclusionType?: 'standard' | 'contractual' | 'custom_cost';
    customCost?: number;
    isQuickRegistration?: boolean;

    // For both
    positions: number;
    urgency: boolean;
    units: number;
    endDate: string; // Critical for yearly lookup

    // For certificates
    pages?: number;
    additionalPages?: number;
    productionType?: 'fully_produced' | 'sufficient_processing';
    certificateServiceType?: 'standard' | 'replacement' | 'reissuance' | 'duplicate';
}

const getCostForPositions = (positions: number, costs: Omit<CostModelRow, 'id' | 'models'>): number => {
    if (positions <= 10) return Number(costs.upTo10) || 0;
    if (positions <= 20) return Number(costs.upTo20) || 0;
    if (positions <= 50) return Number(costs.upTo50) || 0;
    return Number(costs.plus51) || 0;
};

export const calculateCost = (
    data: CostCalculationData,
    yearlySettings: Record<string, YearSettings>,
    activeMode: AppMode
) => {
    const recordYear = data.endDate ? data.endDate.substring(0, 4) : new Date().getFullYear().toString();
    
    // Find settings for the specific year or fallback to the latest available
    let settings = yearlySettings[recordYear];
    if (!settings) {
        const availableYears = Object.keys(yearlySettings).sort();
        const fallbackYear = availableYears.length > 0 ? availableYears[availableYears.length - 1] : "2025";
        settings = yearlySettings[fallbackYear];
    }

    if (!settings) {
        return { 
            sumWithoutDiscount: 0, sumWithDiscount: 0, 
            modelCost: 0, codeCostValue: 0, complexityCost: 0, urgencyCost: 0, pageCost: 0, discountMultiplier: 1,
            mainCertCost: 0, positionsCost: 0, additionalPagesCost: 0, urgentMainCertCost: 0, urgentPositionsCost: 0, urgentAdditionalPagesCost: 0, urgencyMultiplier: 1
        };
    }

    const { generalSettings, costModelTable = [] } = settings;
    
    let sumWithoutDiscount = 0;
    let sumWithDiscount = 0;
    let modelCost = 0;
    let codeCostValue = 0;
    let complexityCost = 0;
    let urgencyCost = 0;
    let pageCost = 0;
    let discountMultiplier = 1;

    let mainCertCost = 0;
    let positionsCost = 0;
    let additionalPagesCost = 0;
    let urgentMainCertCost = 0;
    let urgentPositionsCost = 0;
    let urgentAdditionalPagesCost = 0;
    let urgencyMultiplier = 1;

    if (data.isQuickRegistration) {
        return { 
            sumWithoutDiscount: 0, sumWithDiscount: 0, 
            modelCost: 0, codeCostValue: 0, complexityCost: 0, urgencyCost: 0, pageCost: 0, discountMultiplier: 1,
            mainCertCost: 0, positionsCost: 0, additionalPagesCost: 0, urgentMainCertCost: 0, urgentPositionsCost: 0, urgentAdditionalPagesCost: 0, urgencyMultiplier: 1
        };
    }

    if (activeMode === 'certificates') {
        const gs = generalSettings;
        urgencyMultiplier = data.urgency ? (1 + (gs.urgency || 0) / 100) : 1;
        const isFullyProduced = data.productionType === 'fully_produced';
        const serviceType = data.certificateServiceType || 'standard';

        const costPerAdditionalPosition = (isFullyProduced ? gs.fullyProduced_additionalPositionCost : gs.sufficientProcessing_additionalPositionCost) || 0;
        const costPerAdditionalPage = gs.additionalPageCost || 0;
        
        if (serviceType === 'replacement') mainCertCost = gs.replacementCost || 0;
        else if (serviceType === 'reissuance') mainCertCost = gs.reissuanceCost || 0;
        else if (serviceType === 'duplicate') mainCertCost = gs.duplicateCost || 0;
        else {
            const pages = data.pages || 0;
            if (pages > 0 && pages <= 20) mainCertCost = (isFullyProduced ? gs.fullyProduced_upTo20PagesCost : gs.sufficientProcessing_upTo20PagesCost) || 0;
            else if (pages >= 21 && pages <= 200) mainCertCost = (isFullyProduced ? gs.fullyProduced_from21To200PagesCost : gs.sufficientProcessing_from21To200PagesCost) || 0;
            else if (pages >= 201) mainCertCost = (isFullyProduced ? gs.fullyProduced_plus201PagesCost : gs.sufficientProcessing_plus201PagesCost) || 0;
        }
        
        urgentMainCertCost = mainCertCost * (data.units || 1) * urgencyMultiplier;
        positionsCost = (data.positions || 0) * costPerAdditionalPosition;
        urgentPositionsCost = positionsCost * urgencyMultiplier;
        additionalPagesCost = (data.additionalPages || 0) * costPerAdditionalPage;
        urgentAdditionalPagesCost = additionalPagesCost * urgencyMultiplier;

        sumWithoutDiscount = urgentMainCertCost + urgentPositionsCost + urgentAdditionalPagesCost;
        sumWithDiscount = sumWithoutDiscount;

    } else { // Conclusions
        if (data.discount === 'Зі знижкою') discountMultiplier = (1 - ((generalSettings.discount || 0) / 100));

        if (data.conclusionType === 'custom_cost') {
            sumWithoutDiscount = data.customCost || 0;
            sumWithDiscount = sumWithoutDiscount * discountMultiplier;
        } else if (data.conclusionType === 'contractual') {
            pageCost = (data.pages || 0) * (generalSettings.contractualPageCost || 0);
            codeCostValue = (data.codes || 0) * (generalSettings.codeCost || 0);
            sumWithoutDiscount = pageCost + codeCostValue;
            sumWithDiscount = sumWithoutDiscount * discountMultiplier;
        } else {
            let modelCostRow = costModelTable.find(row => row.models === (data.models || 0));
            if (!modelCostRow && costModelTable.length > 0) {
                const suitableRows = costModelTable.filter(row => row.models <= (data.models || 0));
                modelCostRow = suitableRows.length > 0 ? suitableRows.reduce((prev, current) => (prev.models > current.models) ? prev : current) : costModelTable.reduce((prev, current) => (prev.models < current.models) ? prev : current);
            }
            
            if (modelCostRow) {
                modelCost = getCostForPositions(data.positions, modelCostRow);
                codeCostValue = (data.codes || 0) * (generalSettings.codeCost || 0);
                let currentCost = modelCost + codeCostValue;
                if (data.complexity) {
                    complexityCost = currentCost * ((generalSettings.complexity || 0) / 100);
                    currentCost += complexityCost;
                }
                if (data.urgency) {
                    urgencyCost = currentCost * (generalSettings.urgency / 100);
                    currentCost += urgencyCost;
                }
                sumWithoutDiscount = currentCost;
                sumWithDiscount = sumWithoutDiscount * discountMultiplier;
            }
        }
    }

    return { 
        sumWithoutDiscount, sumWithDiscount, 
        modelCost, codeCostValue, complexityCost, urgencyCost, pageCost, discountMultiplier,
        mainCertCost, positionsCost, additionalPagesCost, urgentMainCertCost, urgentPositionsCost, urgentAdditionalPagesCost, urgencyMultiplier
    };
};
