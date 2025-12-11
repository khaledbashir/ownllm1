import PricingTable from './PricingTable';

export const SmartBlockRegistry = {
    'pricing-table': {
        component: PricingTable,
        label: 'Pricing Table',
        icon: '💰',
        defaultData: []
    },
    // Future blocks:
    // 'product-grid': { ... },
    // 'service-list': { ... }
};

export const getSmartBlock = (type) => {
    return SmartBlockRegistry[type] || null;
};
