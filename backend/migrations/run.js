import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const direction = process.argv[2] || 'up';
  const migrationDir = path.join(__dirname);
  
  try {
    const files = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`Running migrations (${direction})...`);
    
    for (const file of files) {
      if (file.startsWith('001_') || file.startsWith('002_')) {
        const filePath = path.join(migrationDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        console.log(`Executing ${file}...`);
        await pool.query(sql);
        console.log(`✓ ${file} completed`);
      }
    }
    
    console.log('All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();

