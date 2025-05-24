const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearOAuthTokens() {
  try {
    console.log('🔄 Clearing corrupted OAuth tokens...');
    
    // Delete all OAuth tokens
    const deleted = await prisma.oAuthToken.deleteMany({});
    
    console.log(`✅ Cleared ${deleted.count} OAuth tokens from database`);
    console.log('📝 Note: Users will need to re-authenticate with new OAuth credentials');
    
  } catch (error) {
    console.error('❌ Error clearing OAuth tokens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearOAuthTokens(); 