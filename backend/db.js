import { Pool } from 'pg';

const db = new Pool({
  connectionString: 'postgresql://postgres.ejhmymrscznxybycozyn:%)aeGjA*4Kvb!7V@aws-0-ap-south-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false,
  },
});

export default db;
