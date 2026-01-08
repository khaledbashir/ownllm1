function calculateANCQuote(inputs, productCatalogItem) {
  const height = Number(inputs.height) || 0;
  const width = Number(inputs.width) || 0;
  const quantity = Number(inputs.quantity) || 1;

  const baseCostPerSqFt = Number(productCatalogItem.baseCostPerSqFt) || 0;
  // Default margins if not provided, assuming they are fractions (e.g. 0.15 for 15%)
  const structuralMargin = Number(productCatalogItem.structuralMargin) || 0.15;
  const laborMargin = Number(productCatalogItem.laborMargin) || 0.20;
  const fixedCosts = Number(productCatalogItem.fixedCosts) || 0;

  const area = height * width;
  const totalArea = area * quantity;
  
  // Calculate Base Cost for one unit
  const baseCost = area * baseCostPerSqFt;
  
  // Calculate Margin Amounts per unit
  const structuralAmount = baseCost * structuralMargin;
  const laborAmount = baseCost * laborMargin;
  
  // Calculate Unit Price
  const unitPrice = baseCost + structuralAmount + laborAmount + fixedCosts;
  
  // Calculate Totals
  const totalPrice = unitPrice * quantity;

  return {
    clientPrice: {
      description: productCatalogItem.productName,
      unitPrice: Number(unitPrice.toFixed(2)),
      quantity: quantity,
      totalPrice: Number(totalPrice.toFixed(2)),
      dimensions: { width, height, area }
    },
    internalCost: {
      breakdown: {
        baseCostPerUnit: Number(baseCost.toFixed(2)),
        structuralAmountPerUnit: Number(structuralAmount.toFixed(2)),
        laborAmountPerUnit: Number(laborAmount.toFixed(2)),
        fixedCostsPerUnit: Number(fixedCosts.toFixed(2)),
      },
      margins: {
        structural: structuralMargin,
        labor: laborMargin
      },
      totalInternalCost: Number(totalPrice.toFixed(2)) // Currently assuming Price = Cost + Margins
    }
  };
}

module.exports = { calculateANCQuote };
