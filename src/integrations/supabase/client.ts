// Supabase client configuration
import { createClient } from '@supabase/supabase-js';

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not set. Using placeholder values.');
}

// Browser-safe client creation
export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Server-side client with service role
export function getServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  }
  
  return createClient(
    supabaseUrl || 'http://localhost:54321',
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Type-safe table queries
export async function getTable<T = any>(
  tableName: string,
  options?: {
    columns?: string;
    filters?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
  }
): Promise<T[]> {
  let query = supabase.from(tableName).select(options?.columns || '*');
  
  if (options?.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }
  
  if (options?.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? true,
    });
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as T[] || [];
}

// Real-time subscription helper
export function subscribeToTable(
  tableName: string,
  callback: (payload: any) => void,
  filters?: string
) {
  const channel = supabase
    .channel(`table-${tableName}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
        filter: filters,
      },
      callback
    )
    .subscribe();
  
  return () => {
    channel.unsubscribe();
  };
}

// Auth helpers
export async function signUp(email: string, password: string, metadata?: any) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

// Row Level Security (RLS) helper
export async function checkRLSEnabled(tableName: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_rls_enabled', {
    table_name: tableName,
  });
  
  if (error) throw error;
  return data || false;
}

// Enable RLS on a table
export async function enableRLS(tableName: string) {
  const serviceClient = getServiceClient();
  
  const { error } = await serviceClient.rpc('enable_rls', {
    table_name: tableName,
  });
  
  if (error) throw error;
}

// Create RLS policy
export async function createRLSPolicy(
  tableName: string,
  policyName: string,
  action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
  using?: string,
  check?: string
) {
  const serviceClient = getServiceClient();
  
  const { error } = await serviceClient.rpc('create_rls_policy', {
    table_name: tableName,
    policy_name: policyName,
    action,
    using_expression: using,
    check_expression: check,
  });
  
  if (error) throw error;
}
