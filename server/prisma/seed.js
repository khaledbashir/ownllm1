const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const settings = [
    { label: "multi_user_mode", value: "false" },
    { label: "logo_filename", value: "anything-llm.png" },
  ];

  for (let setting of settings) {
    const existing = await prisma.system_settings.findUnique({
      where: { label: setting.label },
    });

    // Only create the setting if it doesn't already exist
    if (!existing) {
      await prisma.system_settings.create({
        data: setting,
      });
    }
  }
  // Seed HotelOS CRM Pipeline: Contract Processing
  const contractPipelineExists = await prisma.crm_pipelines.findFirst({
    where: { name: "Contract Processing" },
  });

  if (!contractPipelineExists) {
    await prisma.crm_pipelines.create({
      data: {
        name: "Contract Processing",
        description: "Pipeline for processing hotel contracts through AI extraction and human review",
        type: "hotel_contract",
        stages: JSON.stringify([
          { id: "inbox", label: "Inbox", color: "#6366f1" },
          {
            id: "glm_extracted",
            label: "GLM Extracted (Waiting for review)",
            color: "#f59e0b",
          },
          {
            id: "verified",
            label: "Verified (Human approved)",
            color: "#10b981",
          },
          { id: "live", label: "Live", color: "#3b82f6" },
        ]),
        color: "#8b5cf6",
      },
    });
    console.log("✅ Created 'Contract Processing' CRM pipeline");
  }}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
