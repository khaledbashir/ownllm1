const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ANC_PRODUCTS = [
  {
    name: "10mm Outdoor Ribbon (Standard)",
    category: "Ribbon",
    basePrice: 250.00,
    structuralMargin: 0.15,
    laborMargin: 0.20,
    fixedFee: 5000
  },
  {
    name: "16mm Outdoor Ribbon (Budget)",
    category: "Ribbon",
    basePrice: 180.00,
    structuralMargin: 0.15,
    laborMargin: 0.18,
    fixedFee: 4000
  },
  {
    name: "6mm Outdoor High-Res Scoreboard",
    category: "Scoreboard",
    basePrice: 450.00,
    structuralMargin: 0.15,
    laborMargin: 0.22,
    fixedFee: 7500
  },
  {
    name: "10mm Outdoor Scoreboard (Pro)",
    category: "Scoreboard",
    basePrice: 280.00,
    structuralMargin: 0.15,
    laborMargin: 0.20,
    fixedFee: 5000
  },
  {
    name: "16mm Outdoor Mesh (Transparent)",
    category: "Facade",
    basePrice: 140.00,
    structuralMargin: 0.25,
    laborMargin: 0.25,
    fixedFee: 3000
  },
  {
    name: "4mm Indoor Center Hung (Premium)",
    category: "Arena",
    basePrice: 600.00,
    structuralMargin: 0.10,
    laborMargin: 0.15,
    fixedFee: 8000
  },
  {
    name: "2.5mm Indoor Fine Pitch (VIP Suite)",
    category: "Indoor",
    basePrice: 950.00,
    structuralMargin: 0.05,
    laborMargin: 0.10,
    fixedFee: 2500
  },
  {
    name: "Custom Curved Facade (Flexible)",
    category: "Architectural",
    basePrice: 550.00,
    structuralMargin: 0.35,
    laborMargin: 0.30,
    fixedFee: 12000
  },
  {
    name: "Perimeter Field Board (FIFA Std)",
    category: "Perimeter",
    basePrice: 320.00,
    structuralMargin: 0.10,
    laborMargin: 0.12,
    fixedFee: 3500
  },
  {
    name: "Concours Digital Signage (LCD Video Wall)",
    category: "Signage",
    basePrice: 120.00,
    structuralMargin: 0.05,
    laborMargin: 0.15,
    fixedFee: 1000
  }
];

async function seedANCProducts() {
  try {
    console.log("🚀 Starting ANC Products Seeding...");

    // Transform products to match database schema
    // Note: The catalog is stored as JSON in the 'ancProductCatalog' field on 'workspaces' table
    // This script will check the first workspace and seed it if empty
    
    const workspaces = await prisma.workspaces.findMany({
      where: { ancProductCatalog: { isSet: false } }
    });

    if (workspaces.length === 0) {
      console.log("✅ No workspaces found needing ANC catalog seeding.");
      return;
    }

    const catalogJSON = JSON.stringify(ANC_PRODUCTS);
    
    let seededCount = 0;
    for (const ws of workspaces) {
      await prisma.workspaces.update({
        where: { id: ws.id },
        data: { ancProductCatalog: catalogJSON }
      });
      seededCount++;
      console.log(`✅ Seeded workspace "${ws.name}" with ${ANC_PRODUCTS.length} ANC products`);
    }

    console.log(`🎉 Seeding complete! ${seededCount} workspace(s) updated.`);
  } catch (error) {
    console.error("❌ Error seeding ANC products:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedANCProducts()
  .then(() => {
    console.log("🎉 Seed script executed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seed script failed:", error);
    process.exit(1);
  });
