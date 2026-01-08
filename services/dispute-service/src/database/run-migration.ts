import dataSource from './data-source';

async function runMigrations() {
  try {
    console.log('🔄 Initializing data source...');
    await dataSource.initialize();
    console.log('✅ Data source initialized');

    console.log('🔄 Running migrations...');
    const migrations = await dataSource.runMigrations();
    
    if (migrations.length === 0) {
      console.log('ℹ️  No pending migrations to run');
    } else {
      console.log(`✅ Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach((migration, index) => {
        console.log(`  ${index + 1}. ${migration.name}`);
      });
    }

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

runMigrations();

