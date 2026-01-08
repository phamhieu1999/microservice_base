import dataSource from './data-source';

async function revertMigration() {
  try {
    console.log('🔄 Initializing data source...');
    await dataSource.initialize();
    console.log('✅ Data source initialized');

    console.log('🔄 Reverting last migration...');
    await dataSource.undoLastMigration();
    console.log('✅ Successfully reverted last migration');

    await dataSource.destroy();
    process.exit(0);
  } catch (error: any) {
    if (error.message?.includes('No migrations')) {
      console.log('ℹ️  No migrations to revert');
      await dataSource.destroy();
      process.exit(0);
    } else {
      console.error('❌ Error reverting migration:', error);
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
      process.exit(1);
    }
  }
}

revertMigration();

