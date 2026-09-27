#!/usr/bin/env node
import { CatalogImporter } from './importer.js';
import path from 'path';

async function main() {
  const args = process.argv.slice(2);
  const targetFile = args[0] || 'data/products.json';

  console.log('\n======================================================');
  console.log('📦 TALENTFLOW AUTONOMOUS PROCUREMENT - CATALOG IMPORTER');
  console.log('======================================================');
  console.log(`📁 Target Ingestion File: ${targetFile}`);

  try {
    const report = await CatalogImporter.ingestFile(targetFile);

    console.log('\n------------------------------------------------------');
    console.log('✅ PRODUCT CATALOG IMPORT COMPLETE');
    console.log('------------------------------------------------------');
    console.log(`📊 Total Processed Rows : ${report.totalRows}`);
    console.log(`✨ Created (New)        : ${report.created}`);
    console.log(`🔄 Updated (Existing)   : ${report.updated}`);
    console.log(`👥 Duplicate Rows       : ${report.duplicates}`);
    console.log(`⏭️  Skipped Rows         : ${report.skipped}`);
    console.log(`❌ Invalid Records      : ${report.invalid}`);
    console.log(`⏱️  Duration             : ${report.durationMs}ms`);
    console.log('------------------------------------------------------\n');

    if (report.errors.length > 0) {
      console.log('⚠️  VALIDATION / ERROR REPORT:');
      report.errors.forEach((err) => {
        console.log(`  - [Row ${err.row}] ${err.identifier}: ${err.message}`);
      });
      console.log('');
    }

    process.exit(report.invalid > 0 && report.created === 0 && report.updated === 0 ? 1 : 0);
  } catch (err: any) {
    console.error('\n❌ Ingestion Failed:', err.message || err);
    process.exit(1);
  }
}

main();
