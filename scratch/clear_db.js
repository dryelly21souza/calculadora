const url = 'https://sqpwwwoviceviwgxjmfo.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxcHd3d292aWNldml3Z3hqbWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MTE4NjgsImV4cCI6MjA5MDk4Nzg2OH0.a9zezmFJcm_V7epHvsAqZXF_tWH_rgmgLX5-Req2J1s';

const tables = [
  'expenses',
  'fixed_bills',
  'saved_balances',
  'initialized_months',
  'investments',
  'investment_goals',
  'investments_initialized_months',
  'portfolio_dividends',
  'portfolios',
  'salary_calculations'
];

async function clear() {
  for (const table of tables) {
    console.log(`Clearing table ${table}...`);
    let queryParam = 'id=not.is.null';
    if (table === 'initialized_months' || table === 'investments_initialized_months' || table === 'saved_balances') {
      queryParam = 'month_str=not.is.null';
    }
    const res = await fetch(`${url}/rest/v1/${table}?${queryParam}`, {
      method: 'DELETE',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    console.log(`Status for ${table}: ${res.status} ${res.statusText}`);
  }
}

clear();
