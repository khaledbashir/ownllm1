#!/usr/bin/env node

/**
 * ANC Formula Bank Test Script
 * Tests the ANC Master Formulas implementation in AncPricingEngine.js
 */

import AncPricingEngine from './server/utils/AncPricingEngine.js';

console.log('\n=== ANC FORMULA BANK TEST ===\n');

// Test Case 1: Indoor, 1.5mm, Standard Timeline
console.log('TEST CASE 1: Indoor Standard Display (RISE WTC scenario)');
console.log('Dimensions: 24ft x 10ft = 240 sqft');
console.log('Pixel Pitch: 1.5mm (Indoor)');
console.log('Margin: 32%\n');

const quote1 = AncPricingEngine.calculate(
  24, 10, '1.5mm', 'indoor', 0.32, null, null, 'existing', 'front', 'standard'
);

console.log('📊 EXECUTIVE SUMMARY:');
console.log('  Base Hardware: $' + (quote1.tabs?.hardware?.base || 0).toLocaleString());
console.log('  Spares: $' + (quote1.tabs?.hardware?.spares || 0).toLocaleString());
console.log('  Processing: $' + (quote1.tabs?.hardware?.processing || 0).toLocaleString());
console.log('  Materials: $' + (quote1.tabs?.structural?.materials || 0).toLocaleString());
console.log('  Structural Labor: $' + (quote1.tabs?.structural?.labor || 0).toLocaleString());
console.log('  Installation: $' + (quote1.tabs?.labor?.install || 0).toLocaleString());
console.log('  PDUs: $' + (quote1.tabs?.electrical?.pdus || 0).toLocaleString());
console.log('  PM (8%): $' + (quote1.tabs?.proServices?.pm || 0).toLocaleString());
console.log('  Cost Basis: $' + quote1.tabs?.summary?.costBasis?.toLocaleString() || 'N/A');
console.log('  Sell Price: $' + quote1.tabs?.summary?.sellPrice?.toLocaleString() || 'N/A');
console.log('  Gross Profit: $' + quote1.tabs?.summary?.grossProfit?.toLocaleString() || 'N/A');
console.log('  Margin: ' + quote1.tabs?.summary?.marginPct?.toFixed(2) + '%\n');

// Test Case 2: Outdoor, 6mm, New Steel, Rigging, Rush Timeline
console.log('\nTEST CASE 2: Outdoor Complex Installation');
console.log('Dimensions: 50ft x 30ft = 1500 sqft');
console.log('Pixel Pitch: 6mm (Outdoor)');
console.log('Modifiers: New Steel + Rigging + Rush Timeline');
console.log('Margin: 30%\n');

const quote2 = AncPricingEngine.calculate(
  50, 30, '6mm', 'outdoor', 0.30, null, null, 'new', 'rigging', 'rush'
);

console.log('📊 EXECUTIVE SUMMARY:');
console.log('  Base Hardware: $' + (quote2.tabs?.hardware?.base || 0).toLocaleString());
console.log('  Materials: $' + (quote2.tabs?.structural?.materials || 0).toLocaleString());
console.log('  Structural Labor: $' + (quote2.tabs?.structural?.labor || 0).toLocaleString());
console.log('  Installation: $' + (quote2.tabs?.labor?.install || 0).toLocaleString());
console.log('  PDUs: $' + (quote2.tabs?.electrical?.pdus || 0).toLocaleString());
console.log('  PM (8%): $' + (quote2.tabs?.proServices?.pm || 0).toLocaleString());
console.log('  Contingency (5%): $' + (quote2.tabs?.summary?.contingency?.toLocaleString() || 'N/A'));
console.log('  Timeline Surcharge (+20%): $' + (quote2.tabs?.summary?.timelineSurcharge?.toLocaleString() || 'N/A'));
console.log('  Cost Basis: $' + quote2.tabs?.summary?.costBasis?.toLocaleString() || 'N/A');
console.log('  Sell Price: $' + quote2.tabs?.summary?.sellPrice?.toLocaleString() || 'N/A');
console.log('  Gross Profit: $' + quote2.tabs?.summary?.grossProfit?.toLocaleString() || 'N/A');
console.log('  Margin: ' + quote2.tabs?.summary?.marginPct?.toFixed(2) + '%\n');

// Test Case 3: Ribbon Board with Curved Access
console.log('\nTEST CASE 3: Ribbon Board Special Product');
console.log('Dimensions: 100ft x 3ft = 300 sqft');
console.log('Pixel Pitch: 10mm (Outdoor)');
console.log('Modifiers: Ribbon Board + Curved Access');
console.log('Margin: 35%\n');

const quote3 = AncPricingEngine.calculate(
  100, 3, '10mm', 'outdoor', 0.35, null, 'Ribbon Board', 'existing', 'curved', 'standard'
);

console.log('📊 EXECUTIVE SUMMARY:');
console.log('  Base Hardware: $' + (quote3.tabs?.hardware?.base || 0).toLocaleString());
console.log('  Ribbon Surcharge (+20%): $' + (quote3.tabs?.hardware?.surcharge || 0).toLocaleString());
console.log('  Materials: $' + (quote3.tabs?.structural?.materials || 0).toLocaleString());
console.log('  Structural Labor: $' + (quote3.tabs?.structural?.labor || 0).toLocaleString());
console.log('  Installation: $' + (quote3.tabs?.labor?.install || 0).toLocaleString());
console.log('  Cost Basis: $' + quote3.tabs?.summary?.costBasis?.toLocaleString() || 'N/A');
console.log('  Sell Price: $' + quote3.tabs?.summary?.sellPrice?.toLocaleString() || 'N/A');
console.log('  Gross Profit: $' + quote3.tabs?.summary?.grossProfit?.toLocaleString() || 'N/A');
console.log('  Margin: ' + quote3.tabs?.summary?.marginPct?.toFixed(2) + '%\n');

console.log('=== FORMULA BANK VERIFICATION COMPLETE ===\n');
