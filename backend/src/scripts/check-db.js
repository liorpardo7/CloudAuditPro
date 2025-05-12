const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const categories = await prisma.auditCategory.findMany({
      include: {
        items: true
      }
    });

    console.log('\nDatabase Content Summary:');
    console.log('------------------------');
    console.log(`Total Categories: ${categories.length}`);
    
    let totalItems = 0;
    categories.forEach(category => {
      console.log(`\nCategory: ${category.name}`);
      console.log(`Items: ${category.items.length}`);
      totalItems += category.items.length;
      
      // Group items by subcategory
      const subcategories = {};
      category.items.forEach(item => {
        const subcategory = item.description.split('(')[1]?.split(')')[0] || 'General';
        if (!subcategories[subcategory]) {
          subcategories[subcategory] = [];
        }
        subcategories[subcategory].push(item);
      });

      // Print items by subcategory
      Object.entries(subcategories).forEach(([subcategory, items]) => {
        console.log(`\n  ${subcategory}:`);
        items.forEach(item => {
          console.log(`    - ${item.name} (${item.status})`);
        });
      });
    });

    console.log('\n------------------------');
    console.log(`Total Audit Items: ${totalItems}`);
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 