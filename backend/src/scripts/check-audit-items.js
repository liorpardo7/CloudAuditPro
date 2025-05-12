const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const categories = await prisma.auditCategory.findMany({
      include: {
        items: true
      }
    });
    
    console.log('Current Categories and Items:');
    console.log('============================');
    
    categories.forEach(category => {
      console.log(`\nCategory: ${category.name}`);
      console.log(`Description: ${category.description}`);
      console.log(`Items (${category.items.length}):`);
      category.items.forEach(item => {
        console.log(`  - ${item.name}`);
        console.log(`    Status: ${item.status}`);
        console.log(`    Script: ${item.scriptFile}`);
        console.log(`    API: ${item.apiEndpoint}`);
      });
    });
    
    // Count total items
    const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
    console.log(`\nTotal Categories: ${categories.length}`);
    console.log(`Total Items: ${totalItems}`);
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 