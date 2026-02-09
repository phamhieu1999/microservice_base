import dataSource from './data-source';

async function showMigrations() {
  try {
    console.log('🔄 Initializing data source...');
    await dataSource.initialize();
    console.log('✅ Data source initialized');

    console.log('📋 Checking migration status...');
    const hasPendingMigrations = await dataSource.showMigrations();
    
    if (!hasPendingMigrations) {
      console.log('✅ All migrations have been executed');
    } else {
      console.log('⏳ There are pending migrations');
    }

    // Show executed migrations
    try {
      const executedMigrations = await dataSource.query(
        "SELECT * FROM migrations ORDER BY timestamp DESC"
      );
      
      if (Array.isArray(executedMigrations) && executedMigrations.length > 0) {
        console.log(`\n✅ Executed migrations (${executedMigrations.length}):`);
        executedMigrations.forEach((migration: any, index: number) => {
          console.log(`  ${index + 1}. ${migration.name}`);
        });
      } else {
        console.log('\nℹ️  No executed migrations found');
      }
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        console.log('\nℹ️  Migrations table does not exist yet');
      } else {
        throw error;
      }
    }

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error showing migrations:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

showMigrations();

