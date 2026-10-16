import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export interface DemoLogin {
  email: string;
  password: string;
  role: 'farmer' | 'roaster' | 'tourist';
  name: string;
  district: string;
}

export interface DemoLogins {
  farmers: DemoLogin[];
  buyers: DemoLogin[];
  tourists: DemoLogin[];
}

/** Parses prisma/demo/DEMO_LOGINS.txt: `email<TAB>password<TAB>role<TAB>name<TAB>district` rows. */
export function parseDemoLogins(text: string): DemoLogins {
  const result: DemoLogins = { farmers: [], buyers: [], tourists: [] };
  for (const line of text.split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue; // comments and "## section" headers
    const [email, password, role, name, district = ''] = line.split('\t');
    if (!email || !password || !role || !name) continue;
    const row = { email, password, role, name, district } as DemoLogin;
    if (role === 'farmer') result.farmers.push(row);
    else if (role === 'roaster') result.buyers.push(row);
    else if (role === 'tourist') result.tourists.push(row);
  }
  return result;
}

let cached: DemoLogins | null = null;

/** Empty lists when the file is not present (for example in a build without demo data). */
export function loadDemoLogins(): DemoLogins {
  if (cached) return cached;
  const file = join(process.cwd(), 'prisma', 'demo', 'DEMO_LOGINS.txt');
  cached = existsSync(file) ? parseDemoLogins(readFileSync(file, 'utf8')) : { farmers: [], buyers: [], tourists: [] };
  return cached;
}
