const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDummyData() {
    const workspaceSlug = 'test'; // Assuming 'test' is the workspace slug

    try {
        const workspace = await prisma.workspaces.findFirst({
            where: { slug: workspaceSlug },
        });

        if (!workspace) {
            console.error(`Workspace with slug '${workspaceSlug}' not found.`);
            return;
        }

        const products = [
            {
                id: "prod_1",
                name: "Website Redesign (Basic)",
                description: "5-page informational website with standard theme.",
                price: 2500,
                pricingType: "fixed",
                category: "Web Development",
                features: ["5 Pages", "Contact Form", "Mobile Responsive", "SEO Basic"]
            },
            {
                id: "prod_2",
                name: "E-commerce Setup",
                description: "Shopify or WooCommerce setup with up to 50 products.",
                price: 5000,
                pricingType: "fixed",
                category: "E-commerce",
                features: ["Product Upload", "Payment Gateway Setup", "Training"]
            },
            {
                id: "prod_3",
                name: "SEO Audit",
                description: "Comprehensive technical and content audit.",
                price: 1500,
                pricingType: "fixed",
                category: "Marketing",
                features: ["Site Crawl", "Keyword Analysis", "Action Plan"]
            }
        ];

        const rateCard = [
            {
                id: "role_1",
                name: "Senior Developer",
                rate: 150,
                category: "Technology"
            },
            {
                id: "role_2",
                name: "UI/UX Designer",
                rate: 125,
                category: "Design"
            },
            {
                id: "role_3",
                name: "Project Manager",
                rate: 100,
                category: "Management"
            }
        ];

        await prisma.workspaces.update({
            where: { id: workspace.id },
            data: {
                products: JSON.stringify(products),
                rateCard: JSON.stringify(rateCard)
            }
        });

        console.log(`Successfully seeded dummy data for workspace '${workspace.name}' (${workspaceSlug}).`);

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedDummyData();
