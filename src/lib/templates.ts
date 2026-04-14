// Template definitions for scaffolding ERP apps

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  modules: string[];
  databaseStrategy: 'supabase' | 'hybrid' | 'cassandra-primary';
  files: TemplateFile[];
}

export interface TemplateFile {
  path: string;
  content: string;
  isEntry?: boolean;
}

// Base template with common structure
export const baseTemplate: TemplateConfig = {
  id: 'base',
  name: 'ERP Base',
  description: 'Foundation template with auth, layout, and database setup',
  modules: [],
  databaseStrategy: 'hybrid',
  files: [
    {
      path: 'app/layout.tsx',
      isEntry: true,
      content: `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ERP Application',
  description: 'AI-generated ERP application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
`
    },
    {
      path: 'app/providers.tsx',
      content: `'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
`
    },
    {
      path: 'app/globals.css',
      content: `@import "tailwindcss";

@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
`
    },
    {
      path: 'lib/db/supabase.ts',
      content: `import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
`
    },
    {
      path: 'lib/db/cassandra.ts',
      content: `import { Client } from 'cassandra-driver';

const cassandraClient = new Client({
  contactPoints: [process.env.CASSANDRA_HOST || 'localhost:9042'],
  localDataCenter: process.env.CASSANDRA_DC || 'datacenter1',
  keyspace: process.env.CASSANDRA_KEYSPACE || 'erp',
  credentials: {
    username: process.env.CASSANDRA_USER || '',
    password: process.env.CASSANDRA_PASSWORD || ''
  }
});

export async function initCassandra() {
  await cassandraClient.connect();
  return cassandraClient;
}

export { cassandraClient };
`
    },
    {
      path: 'types/database.ts',
      content: `export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
`
    },
    {
      path: 'middleware.ts',
      content: `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  // Protect routes that require authentication
  if (req.nextUrl.pathname.startsWith('/(modules)')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }
  
  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
`
    },
    {
      path: 'app/login/page.tsx',
      content: `'use client';

import { useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged in successfully');
      window.location.href = '/';
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center">Sign in to ERP</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
`
    }
  ]
};

// Module-specific templates
export const inventoryTemplate: Partial<TemplateConfig> = {
  modules: ['inventory'],
  databaseStrategy: 'hybrid',
  files: [
    {
      path: 'app/(modules)/inventory/page.tsx',
      content: `'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/db/supabase';
import { DataTable } from '@/components/ui/data-table';

export default function InventoryPage() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*');
      return data || [];
    },
  });

  const columns = [
    { accessorKey: 'sku', header: 'SKU' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'unit_price', header: 'Price' },
    { accessorKey: 'created_at', header: 'Created' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Inventory Management</h1>
      <DataTable columns={columns} data={products || []} isLoading={isLoading} />
    </div>
  );
}
`
    },
    {
      path: 'app/(modules)/inventory/products/new/page.tsx',
      content: `'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/db/supabase';
import { toast } from 'sonner';

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    sku: '',
    name: '',
    description: '',
    unit_price: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from('products').insert({
      sku: form.sku,
      name: form.name,
      description: form.description,
      unit_price: parseFloat(form.unit_price)
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Product created');
      router.push('/inventory');
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">New Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="SKU"
          value={form.sku}
          onChange={e => setForm({...form, sku: e.target.value})}
          className="w-full p-3 border rounded"
          required
        />
        <input
          placeholder="Name"
          value={form.name}
          onChange={e => setForm({...form, name: e.target.value})}
          className="w-full p-3 border rounded"
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={e => setForm({...form, description: e.target.value})}
          className="w-full p-3 border rounded"
        />
        <input
          type="number"
          placeholder="Unit Price"
          value={form.unit_price}
          onChange={e => setForm({...form, unit_price: e.target.value})}
          className="w-full p-3 border rounded"
          step="0.01"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Create Product
        </button>
      </form>
    </div>
  );
}
`
    },
    {
      path: 'app/api/inventory/transaction/route.ts',
      content: `import { NextResponse } from 'next/server';
import { cassandraClient } from '@/lib/db/cassandra';
import { supabase } from '@/lib/db/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { product_id, warehouse_id, transaction_type, quantity, unit_cost } = body;
    
    // Write high-throughput transaction to Cassandra
    const query = \`
      INSERT INTO inventory_transactions 
      (id, product_id, warehouse_id, transaction_type, quantity, unit_cost, created_at, user_id)
      VALUES (uuid(), ?, ?, ?, ?, ?, toTimestamp(now()), ?)
    \`;
    
    await cassandraClient.execute(query, [
      product_id,
      warehouse_id,
      transaction_type,
      quantity,
      unit_cost,
      // user_id from session
    ], { prepare: true });
    
    // Update stock level in Cassandra (high read/write)
    const stockQuery = \`
      UPDATE stock_levels 
      SET quantity = quantity + ?, last_updated = toTimestamp(now())
      WHERE product_id = ? AND warehouse_id = ?
    \`;
    
    await cassandraClient.execute(stockQuery, [
      transaction_type === 'inbound' ? quantity : -quantity,
      product_id,
      warehouse_id
    ], { prepare: true });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transaction error:', error);
    return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 });
  }
}
`
    }
  ]
};

export const crmTemplate: Partial<TemplateConfig> = {
  modules: ['crm'],
  databaseStrategy: 'hybrid',
  files: [
    {
      path: 'app/(modules)/crm/page.tsx',
      content: `'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/db/supabase';
import Link from 'next/link';

export default function CRMPage() {
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data } = await supabase.from('contacts').select('*, companies(name)');
      return data || [];
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">CRM</h1>
        <Link href="/crm/contacts/new" className="px-4 py-2 bg-blue-600 text-white rounded">
          New Contact
        </Link>
      </div>
      
      <div className="grid gap-4">
        {contacts?.map(contact => (
          <div key={contact.id} className="p-4 border rounded hover:shadow-md">
            <h3 className="font-semibold">{contact.first_name} {contact.last_name}</h3>
            <p className="text-gray-600">{contact.email}</p>
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              {contact.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
`
    },
    {
      path: 'app/(modules)/crm/contacts/[id]/page.tsx',
      content: `'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/db/supabase';
import { cassandraClient } from '@/lib/db/cassandra';
import { useEffect, useState } from 'react';

export default function ContactDetailPage() {
  const { id } = useParams();
  const [interactions, setInteractions] = useState([]);
  
  const { data: contact } = useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const { data } = await supabase.from('contacts')
        .select('*, companies(*)')
        .eq('id', id)
        .single();
      return data;
    },
  });

  useEffect(() => {
    // Fetch high-volume interaction data from Cassandra
    const fetchInteractions = async () => {
      const query = \`
        SELECT * FROM interactions 
        WHERE contact_id = ? 
        LIMIT 50
      \`;
      const result = await cassandraClient.execute(query, [id], { prepare: true });
      setInteractions(result.rows);
    };
    
    if (id) fetchInteractions();
  }, [id]);

  if (!contact) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{contact.first_name} {contact.last_name}</h1>
      <p className="text-gray-600">{contact.email}</p>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Interactions</h2>
        <div className="space-y-2">
          {interactions.map((interaction: any) => (
            <div key={interaction.id} className="p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-500">
                {new Date(interaction.created_at).toLocaleDateString()}
              </span>
              <p className="mt-1">{interaction.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`
    },
    {
      path: 'app/api/crm/interaction/route.ts',
      content: `import { NextResponse } from 'next/server';
import { cassandraClient } from '@/lib/db/cassandra';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contact_id, type, channel, summary, user_id } = body;
    
    // Store high-volume interaction in Cassandra
    const query = \`
      INSERT INTO interactions (id, contact_id, type, channel, summary, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, toTimestamp(now()))
    \`;
    
    await cassandraClient.execute(query, [
      uuidv4(),
      contact_id,
      type,
      channel,
      summary,
      user_id
    ], { prepare: true });
    
    // Also record in activity timeline
    const timelineQuery = \`
      INSERT INTO activity_timeline (user_id, activity_type, entity_type, entity_id, action, created_at)
      VALUES (?, 'interaction', 'contact', ?, 'created', toTimestamp(now()))
    \`;
    
    await cassandraClient.execute(timelineQuery, [user_id, contact_id], { prepare: true });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Interaction error:', error);
    return NextResponse.json({ error: 'Failed to record interaction' }, { status: 500 });
  }
}
`
    }
  ]
};

// Template registry
export const templates: Record<string, TemplateConfig> = {
  base: baseTemplate,
  inventory: { ...baseTemplate, ...inventoryTemplate, id: 'inventory', name: 'Inventory System', description: 'Inventory management with barcode support' } as TemplateConfig,
  crm: { ...baseTemplate, ...crmTemplate, id: 'crm', name: 'CRM System', description: 'Customer relationship management' } as TemplateConfig,
  full: {
    ...baseTemplate,
    id: 'full',
    name: 'Full ERP',
    description: 'Complete ERP with all modules',
    modules: ['inventory', 'crm', 'accounting', 'hr'],
    databaseStrategy: 'hybrid',
    files: [...baseTemplate.files, ...inventoryTemplate.files!, ...crmTemplate.files!]
  }
};

export function getTemplate(id: string): TemplateConfig | undefined {
  return templates[id];
}

export function listTemplates() {
  return Object.values(templates).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    modules: t.modules
  }));
}
