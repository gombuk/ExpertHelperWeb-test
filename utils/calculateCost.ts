
import type { Record as AppRecord, CostModelRow, GeneralSettings } from '../types';
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

    // For certificates
    pages?: number;
    additionalPages?: number;
    productionType?: 'fully_produced' | 'sufficient_processing';
    certificateServiceType?: 'standard' | 'replacement' | 'reissuance' | 'duplicate';
}

/**
 * Calculates the cost for a record based on provided data and settings.
 */
export const calculateCost = (
    data: CostCalculationData,
    costModelTable: CostModelRow[] | undefined,
    generalSettings: GeneralSettings,
    activeMode: AppMode
) => {
    const results = { 
        sumWithoutDiscount: 0, sumWithDiscount: 0, 
        modelCost: 0, codeCostValue: 0, complexityCost: 0, urgencyCost: 0, pageCost: 0, discountMultiplier: 1,
        mainCertCost: 0, positionsCost: 0, additionalPagesCost: 0, urgentMainCertCost: 0, urgentPositionsCost: 0, urgentAdditionalPagesCost: 0, urgencyMultiplier: 1
    };

    if (data.isQuickRegistration) {
        return results;
    }

    const gs = generalSettings;

    if (activeMode === 'certificates') {
        const urgencyMult = data.urgency ? (1 + (gs.urgency || 0) / 100) : 1;
        results.urgencyMultiplier = urgencyMult;

        const isFullyProduced = data.productionType === 'fully_produced';
        const serviceType = data.certificateServiceType || 'standard';

        const posCostPerUnit = (isFullyProduced ? gs.fullyProduced_additionalPositionCost : gs.sufficientProcessing_additionalPositionCost) || 0;
        const pageCostPerUnit = gs.additionalPageCost || 0;
        
        let baseCost = 0;
        if (serviceType === 'replacement') {
            baseCost = gs.replacementCost || 0;
        } else if (serviceType === 'reissuance') {
            baseCost = gs.reissuanceCost || 0;
        } else if (serviceType === 'duplicate') {
            baseCost = gs.duplicateCost || 0;
        } else {
            const pages = data.pages || 0;
            if (pages <= 20) {
                baseCost = (isFullyProduced ? gs.fullyProduced_upTo20PagesCost : gs.sufficientProcessing_upTo20PagesCost) || 0;
            } else if (pages <= 200) {
                baseCost = (isFullyProduced ? gs.fullyProduced_from21To200PagesCost : gs.sufficientProcessing_from21To200PagesCost) || 0;
            } else {
                baseCost = (isFullyProduced ? gs.fullyProduced_plus201PagesCost : gs.sufficientProcessing_plus201PagesCost) || 0;
            }
        }
        
        results.mainCertCost = baseCost;
        results.urgentMainCertCost = baseCost * (data.units || 1) * urgencyMult;
        results.positionsCost = (data.positions || 0) * posCostPerUnit;
        results.urgentPositionsCost = results.positionsCost * urgencyMult;
        results.additionalPagesCost = (data.additionalPages || 0) * pageCostPerUnit;
        results.urgentAdditionalPagesCost = results.additionalPagesCost * urgencyMult;

        results.sumWithoutDiscount = results.urgentMainCertCost + results.urgentPositionsCost + results.urgentAdditionalPagesCost;
        results.sumWithDiscount = results.sumWithoutDiscount;

    } else {
        let discountMult = 1;
        if (data.discount === 'Зі знижкою') {
            discountMult = (1 - ((gs.discount || 0) / 100));
        }
        results.discountMultiplier = discountMult;

        if (data.conclusionType === 'custom_cost') {
            results.sumWithoutDiscount = data.customCost || 0;
            results.sumWithDiscount = results.sumWithoutDiscount * discountMult;
        } else if (data.conclusionType === 'contractual') {
            results.pageCost = (data.pages || 0) * (gs.contractualPageCost || 0);
            results.codeCostValue = (data.codes || 0) * (gs.codeCost || 0);
            results.sumWithoutDiscount = results.pageCost + results.codeCostValue;
            results.sumWithDiscount = results.sumWithoutDiscount * discountMult;
        } else if (costModelTable) {
            let selectedRow = costModelTable.find(row => row.models === (data.models || 0));
            if (!selectedRow && costModelTable.length > 0) {
                 const smallerRows = costModelTable.filter(r => r.models <= (data.models || 0));
                 if (smallerRows.length > 0) {
                     selectedRow = smallerRows.sort((a,b) => b.models - a.models)[0];
                 } else {
                     selectedRow = [...costModelTable].sort((a,b) => a.models - b.models)[0];
                 }
            }

            if (selectedRow) {
                const pos = data.positions || 0;
                let basePrice = 0;
                if (pos <= 10) basePrice = Number(selectedRow.upTo10) || 0;
                else if (pos <= 20) basePrice = Number(selectedRow.upTo20) || 0;
                else if (pos <= 50) basePrice = Number(selectedRow.upTo50) || 0;
                else basePrice = Number(selectedRow.plus51) || 0;

                results.modelCost = basePrice;
                results.codeCostValue = (data.codes || 0) * (gs.codeCost || 0);
                
                let subTotal = basePrice + results.codeCostValue;
                
                if (data.complexity) {
                    results.complexityCost = subTotal * ((gs.complexity || 0) / 100);
                    subTotal += results.complexityCost;
                }
                
                if (data.urgency) {
                    results.urgencyCost = subTotal * ((gs.urgency || 0) / 100);
                    subTotal += results.urgencyCost;
                }
                
                results.sumWithoutDiscount = subTotal;
                results.sumWithDiscount = subTotal * discountMult;
            }
        }
    }

    return results;
};
