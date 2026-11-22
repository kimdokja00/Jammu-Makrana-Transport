import fs from 'node:fs';
import path from 'node:path';

/**
 * Load .env.local / .env into process.env without adding a dotenv dependency.
 *
 * Only used by local entry points (`dev-server.js`, `seed.js`). On Vercel the
 * platform injects environment variables, so `index.js` never calls this.
 * Existing process.env values always win over file values.
 */
export function loadEnv(files = ['.env.local', '.env']) {
  const loaded = [];

  // Search current directory and parent directory for env files
  const searchDirs = [process.cwd(), path.resolve(process.cwd(), '..')];

  for (const dir of searchDirs) {
    for (const file of files) {
      const full = path.resolve(dir, file);
      if (!fs.existsSync(full)) continue;

      for (const line of fs.readFileSync(full, 'utf8').split(/\r?\n/)) {
        const match = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line);
        if (!match || line.trim().startsWith('#')) continue;

        const key = match[1];
        if (process.env[key] !== undefined) continue;

        process.env[key] = (match[2] ?? '').replace(/^['"]|['"]$/g, '').trim();
      }

      if (!loaded.includes(file)) {
        loaded.push(file);
      }
    }
  }

  return loaded;
}

export default loadEnv;
