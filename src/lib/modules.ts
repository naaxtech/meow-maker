// ERP Module definitions and interfaces

export interface ERPModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  databaseStrategy: 'supabase' | 'cassandra' | 'hybrid';
  supabaseTables: TableDefinition[];
  cassandraTables: CassandraTableDefinition[];
  features: ModuleFeature[];
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  indexes?: string[];
  rls?: boolean;
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  default?: string;
  primary?: boolean;
  references?: string;
}

export interface CassandraTableDefinition {
  name: string;
  columns: CassandraColumnDefinition[];
  primaryKey: string[];
  clustering?: string[];
  clusteringOrder?: 'ASC' | 'DESC';
}

export interface CassandraColumnDefinition {
  name: string;
  type: string;
  static?: boolean;
}

export interface ModuleFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  config?: Record<string, any>;
}

// Inventory Module
export const inventoryModule: ERPModule = {
  id: 'inventory',
  name: 'Inventory Management',
  description: 'Track products, warehouses, stock levels, and transactions',
  icon: 'Package',
  databaseStrategy: 'hybrid',
  supabaseTables: [
    {
      name: 'products',
      rls: true,
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'sku', type: 'text', nullable: false },
        { name: 'name', type: 'text', nullable: false },
        { name: 'description', type: 'text' },
        { name: 'category_id', type: 'uuid', references: 'categories.id' },
        { name: 'unit_price', type: 'decimal(10,2)' },
        { name: 'barcode', type: 'text' },
        { name: 'weight', type: 'decimal(8,2)' },
        { name: 'dimensions', type: 'jsonb' },
        { name: 'is_active', type: 'boolean', default: 'true' },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
      ],
      indexes: ['sku', 'barcode', 'category_id']
    },
    {
      name: 'categories',
      rls: true,
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'name', type: 'text', nullable: false },
        { name: 'parent_id', type: 'uuid', references: 'categories.id' },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ]
    },
    {
      name: 'warehouses',
      rls: true,
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'name', type: 'text', nullable: false },
        { name: 'code', type: 'text', nullable: false },
        { name: 'address', type: 'text' },
        { name: 'manager_id', type: 'uuid', references: 'users.id' },
        { name: 'is_active', type: 'boolean', default: 'true' },
      ]
    }
  ],
  cassandraTables: [
    {
      name: 'inventory_transactions',
      columns: [
        { name: 'id', type: 'uuid' },
        { name: 'product_id', type: 'uuid' },
        { name: 'warehouse_id', type: 'uuid' },
        { name: 'transaction_type', type: 'text' }, // 'inbound', 'outbound', 'adjustment', 'transfer'
        { name: 'quantity', type: 'int' },
        { name: 'unit_cost', type: 'decimal' },
        { name: 'reference_id', type: 'text' }, // PO, SO, invoice number
        { name: 'reference_type', type: 'text' },
        { name: 'notes', type: 'text' },
        { name: 'user_id', type: 'uuid' },
        { name: 'created_at', type: 'timestamp' },
      ],
      primaryKey: ['id'],
      clustering: ['created_at'],
      clusteringOrder: 'DESC'
    },
    {
      name: 'stock_levels',
      columns: [
        { name: 'product_id', type: 'uuid' },
        { name: 'warehouse_id', type: 'uuid' },
        { name: 'quantity', type: 'int' },
        { name: 'reserved_quantity', type: 'int' },
        { name: 'available_quantity', type: 'int' },
        { name: 'reorder_point', type: 'int' },
        { name: 'max_stock', type: 'int' },
        { name: 'last_updated', type: 'timestamp' },
      ],
      primaryKey: ['product_id', 'warehouse_id']
    },
    {
      name: 'stock_movements',
      columns: [
        { name: 'warehouse_id', type: 'uuid' },
        { name: 'product_id', type: 'uuid' },
        { name: 'movement_date', type: 'timestamp' },
        { name: 'in_quantity', type: 'int' },
        { name: 'out_quantity', type: 'int' },
        { name: 'balance', type: 'int' },
      ],
      primaryKey: ['warehouse_id', 'product_id', 'movement_date'],
      clusteringOrder: 'DESC'
    }
  ],
  features: [
    { id: 'barcode', name: 'Barcode Scanning', description: 'Support for barcode/QR scanning', enabled: true },
    { id: 'multi_warehouse', name: 'Multi-Warehouse', description: 'Manage multiple locations', enabled: true },
    { id: 'fifo', name: 'FIFO Costing', description: 'First-in-first-out inventory costing', enabled: true },
    { id: 'reorder', name: 'Reorder Alerts', description: 'Automatic low stock notifications', enabled: true },
    { id: 'serial', name: 'Serial Numbers', description: 'Track individual item serial numbers', enabled: false },
    { id: 'batch', name: 'Batch/Lot Tracking', description: 'Track product batches and expiry dates', enabled: false },
  ]
};

// CRM Module
export const crmModule: ERPModule = {
  id: 'crm',
  name: 'Customer Relationship Management',
  description: 'Manage contacts, leads, opportunities, and communications',
  icon: 'Users',
  databaseStrategy: 'hybrid',
  supabaseTables: [
    {
      name: 'contacts',
      rls: true,
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'first_name', type: 'text', nullable: false },
        { name: 'last_name', type: 'text', nullable: false },
        { name: 'email', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'mobile', type: 'text' },
        { name: 'title', type: 'text' },
        { name: 'company_id', type: 'uuid', references: 'companies.id' },
        { name: 'status', type: 'text', default: "'lead'" }, // lead, prospect, customer, inactive
        { name: 'source', type: 'text' }, // web, referral, email, phone
        { name: 'assigned_to', type: 'uuid', references: 'users.id' },
        { name: 'tags', type: 'text[]' },
        { name: 'custom_fields', type: 'jsonb' },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
        { name: 'updated_at', type: 'timestamp', default: 'now()' },
      ],
      indexes: ['email', 'company_id', 'assigned_to', 'status']
    },
    {
      name: 'companies',
      rls: true,
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'name', type: 'text', nullable: false },
        { name: 'industry', type: 'text' },
        { name: 'website', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'address', type: 'jsonb' },
        { name: 'size', type: 'text' }, // small, medium, enterprise
        { name: 'annual_revenue', type: 'decimal(12,2)' },
        { name: 'assigned_to', type: 'uuid', references: 'users.id' },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ]
    },
    {
      name: 'opportunities',
      rls: true,
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'name', type: 'text', nullable: false },
        { name: 'contact_id', type: 'uuid', references: 'contacts.id' },
        { name: 'company_id', type: 'uuid', references: 'companies.id' },
        { name: 'value', type: 'decimal(12,2)' },
        { name: 'currency', type: 'text', default: "'USD'" },
        { name: 'stage', type: 'text', default: "'prospecting'" }, // prospecting, qualification, proposal, negotiation, closed_won, closed_lost
        { name: 'probability', type: 'int' },
        { name: 'expected_close_date', type: 'date' },
        { name: 'actual_close_date', type: 'date' },
        { name: 'lead_source', type: 'text' },
        { name: 'assigned_to', type: 'uuid', references: 'users.id' },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ],
      indexes: ['contact_id', 'company_id', 'assigned_to', 'stage']
    }
  ],
  cassandraTables: [
    {
      name: 'interactions',
      columns: [
        { name: 'id', type: 'uuid' },
        { name: 'contact_id', type: 'uuid' },
        { name: 'type', type: 'text' }, // call, email, meeting, note, task
        { name: 'channel', type: 'text' }, // phone, email, in_person, video
        { name: 'summary', type: 'text' },
        { name: 'details', type: 'text' },
        { name: 'outcome', type: 'text' },
        { name: 'follow_up_date', type: 'timestamp' },
        { name: 'user_id', type: 'uuid' },
        { name: 'created_at', type: 'timestamp' },
      ],
      primaryKey: ['contact_id', 'created_at', 'id'],
      clusteringOrder: 'DESC'
    },
    {
      name: 'activity_timeline',
      columns: [
        { name: 'user_id', type: 'uuid' },
        { name: 'created_at', type: 'timestamp' },
        { name: 'activity_type', type: 'text' },
        { name: 'entity_type', type: 'text' }, // contact, company, opportunity
        { name: 'entity_id', type: 'uuid' },
        { name: 'action', type: 'text' }, // created, updated, deleted, viewed
        { name: 'metadata', type: 'map<text,text>' },
      ],
      primaryKey: ['user_id', 'created_at'],
      clusteringOrder: 'DESC'
    },
    {
      name: 'email_tracking',
      columns: [
        { name: 'email_id', type: 'uuid' },
        { name: 'contact_id', type: 'uuid' },
        { name: 'sent_at', type: 'timestamp' },
        { name: 'opened_at', type: 'timestamp' },
        { name: 'clicked_at', type: 'timestamp' },
        { name: 'open_count', type: 'int' },
        { name: 'click_count', type: 'int' },
        { name: 'ip_address', type: 'text' },
      ],
      primaryKey: ['email_id'],
    }
  ],
  features: [
    { id: 'pipeline', name: 'Sales Pipeline', description: 'Visual sales stage management', enabled: true },
    { id: 'activity', name: 'Activity Tracking', description: 'Log calls, emails, meetings', enabled: true },
    { id: 'scoring', name: 'Lead Scoring', description: 'Automatic lead qualification scoring', enabled: true },
    { id: 'automation', name: 'Workflow Automation', description: 'Automated follow-ups and tasks', enabled: false },
    { id: 'email_tracking', name: 'Email Tracking', description: 'Track email opens and clicks', enabled: false },
    { id: 'calendar', name: 'Calendar Sync', description: 'Sync with external calendars', enabled: false },
  ]
};

// Accounting Module
export const accountingModule: ERPModule = {
  id: 'accounting',
  name: 'Accounting & Finance',
  description: 'Invoices, payments, journals, and financial reporting',
  icon: 'DollarSign',
  databaseStrategy: 'hybrid',
  supabaseTables: [
    {
      name: 'accounts',
      rls: true,
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'code', type: 'text', nullable: false }, // Chart of accounts code
        { name: 'name', type: 'text', nullable: false },
        { name: 'type', type: 'text', nullable: false }, // asset, liability, equity, revenue, expense
        { name: 'subtype', type: 'text' },
        { name: 'parent_id', type: 'uuid', references: 'accounts.id' },
        { name: 'is_active', type: 'boolean', default: 'true' },
        { name: 'bank_account_number', type: 'text' },
        { name: 'bank_routing_number', type: 'text' },
        { name: 'currency', type: 'text', default: "'USD'" },
        { name: 'opening_balance', type: 'decimal(12,2)', default: '0' },
        { name: 'current_balance', type: 'decimal(12,2)', default: '0' },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ]
    },
    {
      name: 'invoices',
      rls: true,
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'invoice_number', type: 'text', nullable: false },
        { name: 'contact_id', type: 'uuid', references: 'contacts.id' },
        { name: 'company_id', type: 'uuid', references: 'companies.id' },
        { name: 'issue_date', type: 'date', nullable: false },
        { name: 'due_date', type: 'date', nullable: false },
        { name: 'status', type: 'text', default: "'draft'" }, // draft, sent, paid, overdue, cancelled
        { name: 'subtotal', type: 'decimal(12,2)', default: '0' },
        { name: 'tax_amount', type: 'decimal(12,2)', default: '0' },
        { name: 'total_amount', type: 'decimal(12,2)', default: '0' },
        { name: 'currency', type: 'text', default: "'USD'" },
        { name: 'notes', type: 'text' },
        { name: 'terms', type: 'text' },
        { name: 'paid_date', type: 'date' },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ],
      indexes: ['invoice_number', 'contact_id', 'status', 'due_date']
    },
    {
      name: 'invoice_items',
      rls: true,
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'invoice_id', type: 'uuid', references: 'invoices.id' },
        { name: 'product_id', type: 'uuid', references: 'products.id' },
        { name: 'description', type: 'text' },
        { name: 'quantity', type: 'decimal(10,2)', default: '1' },
        { name: 'unit_price', type: 'decimal(10,2)' },
        { name: 'tax_rate', type: 'decimal(5,2)', default: '0' },
        { name: 'discount_percent', type: 'decimal(5,2)', default: '0' },
        { name: 'line_total', type: 'decimal(12,2)' },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ]
    }
  ],
  cassandraTables: [
    {
      name: 'journal_entries',
      columns: [
        { name: 'id', type: 'uuid' },
        { name: 'entry_date', type: 'timestamp' },
        { name: 'reference_type', type: 'text' }, // invoice, payment, adjustment
        { name: 'reference_id', type: 'uuid' },
        { name: 'account_id', type: 'uuid' },
        { name: 'debit', type: 'decimal' },
        { name: 'credit', type: 'decimal' },
        { name: 'description', type: 'text' },
        { name: 'user_id', type: 'uuid' },
        { name: 'created_at', type: 'timestamp' },
      ],
      primaryKey: ['id'],
      clustering: ['entry_date'],
      clusteringOrder: 'DESC'
    },
    {
      name: 'account_balances_by_date',
      columns: [
        { name: 'account_id', type: 'uuid' },
        { name: 'balance_date', type: 'date' },
        { name: 'opening_balance', type: 'decimal' },
        { name: 'closing_balance', type: 'decimal' },
        { name: 'total_debits', type: 'decimal' },
        { name: 'total_credits', type: 'decimal' },
        { name: 'transaction_count', type: 'int' },
      ],
      primaryKey: ['account_id', 'balance_date'],
      clusteringOrder: 'DESC'
    },
    {
      name: 'payment_transactions',
      columns: [
        { name: 'id', type: 'uuid' },
        { name: 'invoice_id', type: 'uuid' },
        { name: 'payment_date', type: 'timestamp' },
        { name: 'amount', type: 'decimal' },
        { name: 'payment_method', type: 'text' }, // cash, check, card, transfer
        { name: 'reference_number', type: 'text' },
        { name: 'account_id', type: 'uuid' },
        { name: 'user_id', type: 'uuid' },
        { name: 'created_at', type: 'timestamp' },
      ],
      primaryKey: ['id'],
      clustering: ['payment_date'],
      clusteringOrder: 'DESC'
    }
  ],
  features: [
    { id: 'invoicing', name: 'Invoice Management', description: 'Create and manage customer invoices', enabled: true },
    { id: 'payments', name: 'Payment Processing', description: 'Record and reconcile payments', enabled: true },
    { id: 'journal', name: 'Journal Entries', description: 'General ledger journal entries', enabled: true },
    { id: 'reporting', name: 'Financial Reports', description: 'P&L, Balance Sheet, Cash Flow', enabled: true },
    { id: 'multi_currency', name: 'Multi-Currency', description: 'Support for multiple currencies', enabled: false },
    { id: 'tax', name: 'Tax Management', description: 'Automatic tax calculations', enabled: false },
    { id: 'banking', name: 'Bank Reconciliation', description: 'Automated bank feed matching', enabled: false },
  ]
};

// HR Module
export const hrModule: ERPModule = {
  id: 'hr',
  name: 'Human Resources',
  description: 'Employee management, attendance, payroll, and documents',
  icon: 'Users',
  databaseStrategy: 'hybrid',
  supabaseTables: [
    {
      name: 'employees',
      rls: true,
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'employee_number', type: 'text', nullable: false },
        { name: 'first_name', type: 'text', nullable: false },
        { name: 'last_name', type: 'text', nullable: false },
        { name: 'email', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'hire_date', type: 'date', nullable: false },
        { name: 'termination_date', type: 'date' },
        { name: 'department_id', type: 'uuid', references: 'departments.id' },
        { name: 'job_title', type: 'text' },
        { name: 'employment_type', type: 'text', default: "'full_time'" }, // full_time, part_time, contract, intern
        { name: 'manager_id', type: 'uuid', references: 'employees.id' },
        { name: 'salary', type: 'decimal(10,2)' },
        { name: 'salary_currency', type: 'text', default: "'USD'" },
        { name: 'pay_frequency', type: 'text', default: "'monthly'" }, // hourly, weekly, biweekly, monthly
        { name: 'status', type: 'text', default: "'active'" }, // active, on_leave, terminated
        { name: 'address', type: 'jsonb' },
        { name: 'emergency_contact', type: 'jsonb' },
        { name: 'benefits', type: 'jsonb' },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ],
      indexes: ['employee_number', 'email', 'department_id', 'manager_id', 'status']
    },
    {
      name: 'departments',
      rls: true,
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'name', type: 'text', nullable: false },
        { name: 'code', type: 'text' },
        { name: 'parent_id', type: 'uuid', references: 'departments.id' },
        { name: 'manager_id', type: 'uuid', references: 'employees.id' },
        { name: 'cost_center', type: 'text' },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ]
    },
    {
      name: 'employee_documents',
      rls: true,
      columns: [
        { name: 'id', type: 'uuid', primary: true, default: 'gen_random_uuid()' },
        { name: 'employee_id', type: 'uuid', references: 'employees.id' },
        { name: 'document_type', type: 'text' }, // contract, id, certification, tax_form
        { name: 'file_name', type: 'text' },
        { name: 'file_url', type: 'text' },
        { name: 'mime_type', type: 'text' },
        { name: 'file_size', type: 'int' },
        { name: 'uploaded_by', type: 'uuid', references: 'users.id' },
        { name: 'created_at', type: 'timestamp', default: 'now()' },
      ]
    }
  ],
  cassandraTables: [
    {
      name: 'time_entries',
      columns: [
        { name: 'id', type: 'uuid' },
        { name: 'employee_id', type: 'uuid' },
        { name: 'entry_date', type: 'date' },
        { name: 'clock_in', type: 'timestamp' },
        { name: 'clock_out', type: 'timestamp' },
        { name: 'break_duration', type: 'int' }, // minutes
        { name: 'total_hours', type: 'decimal' },
        { name: 'project_id', type: 'uuid' },
        { name: 'task_id', type: 'uuid' },
        { name: 'notes', type: 'text' },
        { name: 'location', type: 'text' },
        { name: 'created_at', type: 'timestamp' },
      ],
      primaryKey: ['employee_id', 'entry_date', 'id'],
      clusteringOrder: 'DESC'
    },
    {
      name: 'attendance_records',
      columns: [
        { name: 'employee_id', type: 'uuid' },
        { name: 'record_date', type: 'date' },
        { name: 'status', type: 'text' }, // present, absent, late, half_day, leave
        { name: 'check_in_time', type: 'timestamp' },
        { name: 'check_out_time', type: 'timestamp' },
        { name: 'work_duration', type: 'int' }, // minutes
        { name: 'overtime_minutes', type: 'int' },
        { name: 'late_minutes', type: 'int' },
        { name: 'shift_id', type: 'uuid' },
        { name: 'notes', type: 'text' },
      ],
      primaryKey: ['employee_id', 'record_date']
    },
    {
      name: 'payroll_records',
      columns: [
        { name: 'id', type: 'uuid' },
        { name: 'employee_id', type: 'uuid' },
        { name: 'pay_period_start', type: 'date' },
        { name: 'pay_period_end', type: 'date' },
        { name: 'regular_hours', type: 'decimal' },
        { name: 'overtime_hours', type: 'decimal' },
        { name: 'gross_pay', type: 'decimal' },
        { name: 'tax_deductions', type: 'decimal' },
        { name: 'other_deductions', type: 'decimal' },
        { name: 'net_pay', type: 'decimal' },
        { name: 'currency', type: 'text' },
        { name: 'payment_date', type: 'date' },
        { name: 'payment_status', type: 'text' }, // pending, processed, paid
        { name: 'created_at', type: 'timestamp' },
      ],
      primaryKey: ['id'],
      clustering: ['pay_period_start'],
      clusteringOrder: 'DESC'
    }
  ],
  features: [
    { id: 'directory', name: 'Employee Directory', description: 'Manage employee records and profiles', enabled: true },
    { id: 'attendance', name: 'Time & Attendance', description: 'Clock in/out and attendance tracking', enabled: true },
    { id: 'leave', name: 'Leave Management', description: 'PTO, sick leave, and vacation tracking', enabled: true },
    { id: 'payroll', name: 'Payroll Processing', description: 'Calculate and process payroll', enabled: false },
    { id: 'performance', name: 'Performance Reviews', description: 'Employee evaluation and goals', enabled: false },
    { id: 'documents', name: 'Document Management', description: 'Store and manage HR documents', enabled: true },
    { id: 'recruitment', name: 'Recruitment', description: 'Hiring and applicant tracking', enabled: false },
  ]
};

// Export all modules
export const erpModules: Record<string, ERPModule> = {
  inventory: inventoryModule,
  crm: crmModule,
  accounting: accountingModule,
  hr: hrModule
};

// Get module by ID
export function getModule(id: string): ERPModule | undefined {
  return erpModules[id];
}

// List all available modules
export function listModules(): Array<Pick<ERPModule, 'id' | 'name' | 'description' | 'icon'>> {
  return Object.values(erpModules).map(m => ({
    id: m.id,
    name: m.name,
    description: m.description,
    icon: m.icon
  }));
}

// Generate SQL for Supabase tables
export function generateSupabaseSQL(module: ERPModule): string {
  const statements: string[] = [];
  
  for (const table of module.supabaseTables) {
    // Create table
    const columnDefs = table.columns.map(col => {
      let def = `${col.name} ${col.type}`;
      if (col.primary) def += ' PRIMARY KEY';
      if (!col.nullable && !col.primary) def += ' NOT NULL';
      if (col.default) def += ` DEFAULT ${col.default}`;
      if (col.references) def += ` REFERENCES ${col.references}`;
      return def;
    }).join(',\n  ');
    
    statements.push(`CREATE TABLE IF NOT EXISTS ${table.name} (
  ${columnDefs}
);`);
    
    // Enable RLS
    if (table.rls) {
      statements.push(`ALTER TABLE ${table.name} ENABLE ROW LEVEL SECURITY;`);
      
      // Create basic policies
      statements.push(`CREATE POLICY "Users can read own data" ON ${table.name}
  FOR SELECT TO authenticated USING (true);`);
      
      statements.push(`CREATE POLICY "Users can insert own data" ON ${table.name}
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);`);
      
      statements.push(`CREATE POLICY "Users can update own data" ON ${table.name}
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);`);
    }
    
    // Create indexes
    for (const index of table.indexes || []) {
      statements.push(`CREATE INDEX IF NOT EXISTS idx_${table.name}_${index} ON ${table.name}(${index});`);
    }
  }
  
  return statements.join('\n\n');
}

// Generate CQL for Cassandra tables
export function generateCassandraCQL(module: ERPModule): string {
  const statements: string[] = [];
  
  for (const table of module.cassandraTables) {
    const columnDefs = table.columns.map(col => {
      let def = `${col.name} ${col.type}`;
      if (col.static) def += ' STATIC';
      return def;
    }).join(',\n  ');
    
    let primaryKey = `PRIMARY KEY (${table.primaryKey.join(', ')})`;
    if (table.clustering) {
      primaryKey = `PRIMARY KEY ((${table.primaryKey.join(', ')}), ${table.clustering.join(', ')})`;
    }
    
    let cql = `CREATE TABLE IF NOT EXISTS ${table.name} (
  ${columnDefs},
  ${primaryKey}
)`;
    
    if (table.clusteringOrder) {
      cql += `\nWITH CLUSTERING ORDER BY (${table.clustering?.map(c => `${c} ${table.clusteringOrder}`).join(', ')})`;
    }
    
    cql += ';';
    statements.push(cql);
  }
  
  return statements.join('\n\n');
}
