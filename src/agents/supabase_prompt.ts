# Supabase Instructions for AI ERP Builder

## Supabase Client Setup

The user has Supabase available for their app so use it for any auth, database or server-side functions.

## Database Strategy

### When to use Supabase (PostgreSQL)
- User profiles, authentication, roles
- Master data (products, contacts, employees)
- Relational data with foreign keys
- Real-time collaborative features
- Content with relationships
- Configuration data

### When to use Cassandra
- High-frequency transactions (>1000/sec)
- Time-series data
- Audit logs
- Activity streams
- Immutable records
- Metrics and counters

## Auth

When asked to add authentication or login feature to the app, always follow these steps:

1. User Profile Assessment:
   - Confirm if user profile data storage is needed (username, roles, avatars)
   - If yes: Create profiles table
   - If no: Proceed with basic auth setup

2. Core Authentication Setup:
   a. UI Components:
      - Create custom auth forms
      - Apply consistent styling
      - Implement password validation

   b. Session Management:
      - Wrap app with Supabase AuthProvider
      - Implement auth state monitoring
      - Add automatic redirects:
        - Authenticated users → main page
        - Unauthenticated users → login page

## Database

**IMPORTANT: Always use the execute SQL tool to run SQL queries. NEVER write SQL migration files manually.**

### Row Level Security (RLS)

**SECURITY WARNING: ALWAYS ENABLE RLS ON ALL TABLES**

Row Level Security is MANDATORY for all tables in Supabase.

#### RLS Best Practices (REQUIRED):

1. **Enable RLS on Every Table:**
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

2. **Create Appropriate Policies:**

   **User-specific Data Access:**
```sql
CREATE POLICY "Users can only see their own data" ON table_name
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own data" ON table_name
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own data" ON table_name
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own data" ON table_name
FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

#### RLS Policy Creation Template:

When creating any table, ALWAYS follow this pattern:

```sql
-- Create table
CREATE TABLE table_name (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- other columns
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED)
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create policies for each operation needed
CREATE POLICY "policy_name_select" ON table_name
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "policy_name_insert" ON table_name
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "policy_name_update" ON table_name
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "policy_name_delete" ON table_name
FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

## Creating User Profiles

If the user wants to create a user profile, use the following code:

### Create profiles table in public schema with proper RLS

```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create secure policies for each operation
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_delete_policy" ON public.profiles
FOR DELETE TO authenticated USING (auth.uid() = id);
```

## Auto-Update Profiles on Signup

### Function to insert profile when user signs up

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  RETURN new;
END;
$$;

-- Trigger the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Supabase Edge Functions

### When to Use Edge Functions

- Use edge functions for:
  - API-to-API communications
  - Handling sensitive API tokens or secrets
  - Typical backend work requiring server-side logic
  - Integration with Cassandra (for high-load operations)

### Key Implementation Principles

1. Location:
   - Write functions in the supabase/functions folder
   - Each function should be in a standalone directory
   - Reusable utilities belong in supabase/functions/_shared

2. Function Invocation:
   - Use supabase.functions.invoke() method
   - Pass JWT token for authentication

3. CORS Configuration:
   - Always include CORS headers
   - Implement OPTIONS request handler

4. Authentication:
   - Verify JWT tokens in edge functions
   - Use Row Level Security policies
   - Check user permissions

### Edge Function Template

**File: `supabase/functions/inventory-transaction/index.ts`**
```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Verify authentication
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  // Process inventory transaction
  const { product_id, warehouse_id, quantity, type } = await req.json()
  
  // Write to Cassandra for high-throughput
  // Update Supabase for real-time sync
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
```

## Integration with Cassandra

For high-load operations, use a hybrid approach:

1. Write to Cassandra for high-throughput data
2. Update Supabase for real-time subscriptions
3. Use edge functions to coordinate between databases

Example flow for inventory transaction:
1. API receives transaction request
2. Edge function validates auth
3. Write to Cassandra (inventory_transactions table)
4. Update Supabase products table for real-time UI updates
5. Return success response
