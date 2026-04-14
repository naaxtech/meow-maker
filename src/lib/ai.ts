import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';
import { z } from 'zod';

// AI Provider configuration
export const aiConfig = {
  defaultProvider: process.env.AI_PROVIDER || 'openai',
  models: {
    openai: {
      default: 'gpt-4o',
      mini: 'gpt-4o-mini',
      reasoning: 'o3-mini'
    },
    anthropic: {
      default: 'claude-3-7-sonnet-20250219',
      mini: 'claude-3-5-haiku-20241022'
    }
  }
};

// Initialize AI providers
export function getOpenAIClient() {
  return createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL
  });
}

export function getAnthropicClient() {
  return createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
}

// Get the appropriate model client
export function getAIModel(modelName?: string) {
  const provider = aiConfig.defaultProvider;
  
  if (provider === 'anthropic') {
    return getAnthropicClient()(modelName || aiConfig.models.anthropic.default);
  }
  
  return getOpenAIClient()(modelName || aiConfig.models.openai.default);
}

// Generate app from prompt
export async function generateApp(prompt: string, options?: {
  modules?: string[];
  databaseStrategy?: 'supabase' | 'hybrid' | 'cassandra-primary';
  stream?: boolean;
}) {
  const systemPrompt = `You are an AI ERP Builder. Create a complete, production-ready ERP application.

User request: "${prompt}"

${options?.modules ? `Include these modules: ${options.modules.join(', ')}` : ''}

Database strategy: ${options?.databaseStrategy || 'hybrid'}

Generate the complete application code with:
1. Database schemas (Supabase PostgreSQL + Cassandra if needed)
2. Next.js app routes and API endpoints
3. React components with forms, tables, and dashboards
4. TypeScript types and validation
5. Business logic and calculations
6. Authentication and authorization

Use these tags for file creation:
- <erp-write path="..."> for new files
- <erp-edit path="..."> for modifying files
- <erp-delete path="..."> for removing files

Rules:
- Generate complete, runnable code (no TODO comments)
- Use TypeScript strictly
- Follow the modular ERP architecture
- Include proper error handling
- Enable Supabase RLS on all tables
- Use Cassandra for high-throughput time-series data
- Make UI responsive with Tailwind CSS
- Use shadcn/ui components when available`;

  if (options?.stream) {
    return streamText({
      model: getAIModel(),
      system: systemPrompt,
      prompt: prompt
    });
  }

  const result = await generateText({
    model: getAIModel(),
    system: systemPrompt,
    prompt: prompt,
    maxTokens: 8000
  });

  return result.text;
}

// Parse generated code and extract file operations
export function parseGeneratedCode(response: string) {
  const files: Array<{ type: 'write' | 'edit' | 'delete'; path: string; content: string }> = [];
  
  // Parse <erp-write> tags
  const writeRegex = /<erp-write\s+path="([^"]+)"(?:\s+description="[^"]*")?>([\s\S]*?)<\/erp-write>/g;
  let match;
  while ((match = writeRegex.exec(response)) !== null) {
    files.push({ type: 'write', path: match[1], content: match[2].trim() });
  }
  
  // Parse <erp-edit> tags
  const editRegex = /<erp-edit\s+path="([^"]+)">([\s\S]*?)<\/erp-edit>/g;
  while ((match = editRegex.exec(response)) !== null) {
    files.push({ type: 'edit', path: match[1], content: match[2].trim() });
  }
  
  // Parse <erp-delete> tags
  const deleteRegex = /<erp-delete\s+path="([^"]+)"\s*\/>/g;
  while ((match = deleteRegex.exec(response)) !== null) {
    files.push({ type: 'delete', path: match[1], content: '' });
  }
  
  return files;
}

// Generate database schema based on modules
export function generateDatabaseSchema(modules: string[]) {
  const schemas: Record<string, { supabase: string[]; cassandra: string[] }> = {
    inventory: {
      supabase: [
        `CREATE TABLE products (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          sku TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          category_id UUID REFERENCES categories(id),
          unit_price DECIMAL(10,2),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );`,
        `CREATE TABLE categories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          parent_id UUID REFERENCES categories(id)
        );`,
        `CREATE TABLE warehouses (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          location TEXT,
          manager_id UUID REFERENCES employees(id)
        );`
      ],
      cassandra: [
        `CREATE TABLE IF NOT EXISTS inventory_transactions (
          id UUID PRIMARY KEY,
          product_id UUID,
          warehouse_id UUID,
          transaction_type TEXT,
          quantity INT,
          unit_cost DECIMAL,
          reference_id TEXT,
          created_at TIMESTAMP,
          user_id UUID
        ) WITH CLUSTERING ORDER BY (created_at DESC);`,
        `CREATE TABLE IF NOT EXISTS stock_levels (
          product_id UUID PRIMARY KEY,
          warehouse_id UUID,
          quantity INT,
          reserved_quantity INT,
          available_quantity INT,
          last_updated TIMESTAMP
        );`
      ]
    },
    crm: {
      supabase: [
        `CREATE TABLE contacts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          company_id UUID REFERENCES companies(id),
          status TEXT DEFAULT 'lead',
          assigned_to UUID REFERENCES users(id),
          created_at TIMESTAMP DEFAULT NOW()
        );`,
        `CREATE TABLE companies (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          industry TEXT,
          website TEXT,
          size TEXT
        );`,
        `CREATE TABLE opportunities (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          contact_id UUID REFERENCES contacts(id),
          value DECIMAL(12,2),
          stage TEXT DEFAULT 'prospecting',
          probability INT,
          expected_close_date DATE,
          created_at TIMESTAMP DEFAULT NOW()
        );`
      ],
      cassandra: [
        `CREATE TABLE IF NOT EXISTS interactions (
          id UUID PRIMARY KEY,
          contact_id UUID,
          type TEXT,
          channel TEXT,
          summary TEXT,
          user_id UUID,
          created_at TIMESTAMP
        ) WITH CLUSTERING ORDER BY (created_at DESC);`,
        `CREATE TABLE IF NOT EXISTS activity_timeline (
          user_id UUID,
          activity_type TEXT,
          entity_type TEXT,
          entity_id UUID,
          action TEXT,
          created_at TIMESTAMP,
          PRIMARY KEY (user_id, created_at)
        ) WITH CLUSTERING ORDER BY (created_at DESC);`
      ]
    }
  };
  
  const result = { supabase: [] as string[], cassandra: [] as string[] };
  
  for (const module of modules) {
    if (schemas[module]) {
      result.supabase.push(...schemas[module].supabase);
      result.cassandra.push(...schemas[module].cassandra);
    }
  }
  
  return result;
}
