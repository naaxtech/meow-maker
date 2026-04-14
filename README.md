# AI ERP Builder

An AI-powered app builder that creates modular ERP applications with Supabase and Cassandra integration.

## Features

- **AI-Powered App Generation**: Natural language prompts create full ERP applications
- **Modular ERP System**: Plug-and-play modules for Inventory, CRM, Accounting, and HR
- **Dual Database Architecture**:
  - Supabase for primary data, auth, and real-time features
  - Cassandra for high-load transactional data and time-series analytics
- **Payload CMS Integration**: Best-in-class headless CMS for content and data management

## Architecture

```
ai-erp-builder/
├── src/
│   ├── builder/          # AI app builder core
│   │   ├── prompts/      # System prompts for AI
│   │   ├── templates/    # App scaffolding templates
│   │   └── generators/   # Code generation engines
│   ├── erp-modules/      # Modular ERP components
│   │   ├── inventory/    # Inventory & warehouse management
│   │   ├── crm/          # Customer relationship management
│   │   ├── accounting/   # Financial management
│   │   └── hr/           # Human resources
│   ├── integrations/
│   │   ├── supabase/     # Supabase client & config
│   │   └── cassandra/    # Cassandra client & config
│   └── agents/           # AI agent configurations
├── scaffold/             # Template projects
├── supabase/             # Supabase functions & migrations
└── payload/              # Payload CMS configuration
```

## CMS Recommendation: Payload CMS

**Why Payload over Medusa/WooCommerce:**

| Feature | Payload CMS | Medusa JS | WordPress+Woo |
|---------|-------------|-----------|---------------|
| **Use Case** | General apps/CMS | E-commerce only | E-commerce only |
| **Tech Stack** | Next.js native | Node.js/Express | PHP |
| **Flexibility** | High - any content type | Medium - commerce only | Low - plugin-dependent |
| **Type Safety** | Full TypeScript | TypeScript | Minimal |
| **Modularity** | Collections & globals | Plugin-based | Plugin-based |
| **API** | GraphQL + REST + direct DB | REST | REST |
| **Admin UI** | React, customizable | React | PHP-based |
| **Best For** | ERP, CMS, apps | Online stores | Simple stores |

**Verdict for ERP**: Payload CMS is the clear winner because:
1. Not commerce-specific (ERP needs HR, Accounting, etc.)
2. Next.js native (fits modern stack)
3. More flexible for custom modules
4. Better TypeScript support
5. Can build general business applications

## Database Strategy

| Data Type | Database | Use Case |
|-----------|----------|----------|
| Users, Auth, Config | Supabase | Primary data, real-time sync |
| Inventory Transactions | Cassandra | High-throughput writes, time-series |
| Financial Records | Cassandra | Audit logs, immutable history |
| CRM Interactions | Cassandra | Activity streams, event tracking |
| Content, Documents | Supabase | Structured content with relations |

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase and Cassandra credentials

# Run the builder
npm run dev
```

## Usage

1. Open the AI Builder interface at `/builder`
2. Describe the ERP app you want (e.g., "Create an inventory system with barcode scanning")
3. The AI will generate a complete application with:
   - Database schema (Supabase + Cassandra where needed)
   - UI components
   - API routes
   - Business logic

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cassandra
CASSANDRA_CONTACT_POINTS=localhost:9042
CASSANDRA_LOCAL_DC=datacenter1
CASSANDRA_KEYSPACE=erp
CASSANDRA_USER=cassandra
CASSANDRA_PASSWORD=cassandra

# AI Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

## Module Details

### Inventory Module
- Multi-warehouse support
- Barcode scanning
- FIFO/LIFO costing
- Reorder point alerts
- Serial/batch tracking (optional)

### CRM Module
- Contact & company management
- Sales pipeline
- Activity tracking
- Lead scoring
- Email integration (optional)

### Accounting Module
- Chart of accounts
- Invoicing
- Payment processing
- Financial reports
- Multi-currency (optional)

### HR Module
- Employee directory
- Time & attendance
- Leave management
- Payroll processing (optional)
- Document management

## License

MIT
