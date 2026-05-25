import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Faltan las credenciales de Supabase en el archivo .env");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
