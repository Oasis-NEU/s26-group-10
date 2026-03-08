//This is the supabase client, we use it tp communicate with the db

import {createClient} from "@supabase/supabase-js"

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(
  URL, KEY
);