import { execSync } from 'child_process';
import path from 'path';

export function runDatabaseSeed(): void {
  const backendDir = path.resolve(__dirname, '../../../');
  execSync('npx tsx prisma/seed.ts', {
    cwd: backendDir,
    stdio: 'pipe',
    env: { ...process.env },
  });
}
