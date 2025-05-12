const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function queryAuditItems() {
  try {
    // Get all categories with their items
    const categories = await prisma.auditCategory.findMany({
      include: {
        items: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Display results
    console.log('\n=== Audit Categories and Items ===\n');
    
    for (const category of categories) {
      console.log(`\nCategory: ${category.name}`);
      console.log('Description:', category.description);
      console.log('Items:', category.items.length);
      console.log('----------------------------------------');
      
      // Group items by subcategory
      const subcategories = {};
      for (const item of category.items) {
        const subcategory = item.description.split('(')[1]?.split(')')[0] || 'General';
        if (!subcategories[subcategory]) {
          subcategories[subcategory] = [];
        }
        subcategories[subcategory].push(item);
      }

      // Display items by subcategory
      for (const [subcategory, items] of Object.entries(subcategories)) {
        console.log(`\nSubcategory: ${subcategory}`);
        console.log('----------------------------------------');
        for (const item of items) {
          console.log(`\nName: ${item.name}`);
          console.log(`Status: ${item.status}`);
          console.log(`Script: ${item.scriptFile}`);
          console.log(`API: ${item.apiEndpoint}`);
        }
      }
      console.log('\n========================================\n');
    }

    // Display summary
    const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
    console.log('\n=== Summary ===');
    console.log(`Total Categories: ${categories.length}`);
    console.log(`Total Items: ${totalItems}`);
    
    // Count items by status
    const statusCounts = {};
    categories.forEach(category => {
      category.items.forEach(item => {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
      });
    });
    
    console.log('\nStatus Distribution:');
    for (const [status, count] of Object.entries(statusCounts)) {
      console.log(`${status}: ${count} items`);
    }

  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

queryAuditItems(); 