import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sqpwwwoviceviwgxjmfo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxcHd3d292aWNldml3Z3hqbWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MTE4NjgsImV4cCI6MjA5MDk4Nzg2OH0.a9zezmFJcm_V7epHvsAqZXF_tWH_rgmgLX5-Req2J1s';

export const supabase = createClient(supabaseUrl, supabaseKey);
