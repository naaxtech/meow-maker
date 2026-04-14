import { buildConfig } from 'payload/config'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

// Collections
const Users = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    { name: 'firstName', type: 'text' },
    { name: 'lastName', type: 'text' },
    { name: 'role', type: 'select', options: ['admin', 'manager', 'user'], defaultValue: 'user' },
  ],
}

const Products = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'sku', type: 'text', required: true, unique: true },
    { name: 'description', type: 'richText', editor: lexicalEditor() },
    { name: 'category', type: 'relationship', relationTo: 'categories' },
    { name: 'unitPrice', type: 'number' },
    { name: 'barcode', type: 'text' },
    { name: 'isActive', type: 'checkbox', defaultValue: true },
    { name: 'images', type: 'upload', relationTo: 'media', hasMany: true },
  ],
}

const Categories = {
  slug: 'categories',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'parent', type: 'relationship', relationTo: 'categories' },
  ],
}

const Contacts = {
  slug: 'contacts',
  admin: {
    useAsTitle: 'fullName',
  },
  fields: [
    { name: 'firstName', type: 'text', required: true },
    { name: 'lastName', type: 'text', required: true },
    { name: 'fullName', type: 'text', admin: { hidden: true } },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text' },
    { name: 'company', type: 'relationship', relationTo: 'companies' },
    { name: 'status', type: 'select', options: ['lead', 'prospect', 'customer', 'inactive'], defaultValue: 'lead' },
    { name: 'assignedTo', type: 'relationship', relationTo: 'users' },
    { name: 'notes', type: 'richText', editor: lexicalEditor() },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        data.fullName = `${data.firstName} ${data.lastName}`
        return data
      },
    ],
  },
}

const Companies = {
  slug: 'companies',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'industry', type: 'text' },
    { name: 'website', type: 'text' },
    { name: 'size', type: 'select', options: ['small', 'medium', 'enterprise'] },
    { name: 'annualRevenue', type: 'number' },
    { name: 'assignedTo', type: 'relationship', relationTo: 'users' },
  ],
}

const Opportunities = {
  slug: 'opportunities',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'contact', type: 'relationship', relationTo: 'contacts' },
    { name: 'company', type: 'relationship', relationTo: 'companies' },
    { name: 'value', type: 'number' },
    { name: 'currency', type: 'text', defaultValue: 'USD' },
    { name: 'stage', type: 'select', options: ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'], defaultValue: 'prospecting' },
    { name: 'probability', type: 'number', min: 0, max: 100 },
    { name: 'expectedCloseDate', type: 'date' },
    { name: 'assignedTo', type: 'relationship', relationTo: 'users' },
  ],
}

const Employees = {
  slug: 'employees',
  admin: {
    useAsTitle: 'fullName',
  },
  fields: [
    { name: 'employeeNumber', type: 'text', required: true, unique: true },
    { name: 'firstName', type: 'text', required: true },
    { name: 'lastName', type: 'text', required: true },
    { name: 'fullName', type: 'text', admin: { hidden: true } },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text' },
    { name: 'hireDate', type: 'date', required: true },
    { name: 'department', type: 'relationship', relationTo: 'departments' },
    { name: 'jobTitle', type: 'text' },
    { name: 'employmentType', type: 'select', options: ['full_time', 'part_time', 'contract', 'intern'], defaultValue: 'full_time' },
    { name: 'salary', type: 'number' },
    { name: 'status', type: 'select', options: ['active', 'on_leave', 'terminated'], defaultValue: 'active' },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        data.fullName = `${data.firstName} ${data.lastName}`
        return data
      },
    ],
  },
}

const Departments = {
  slug: 'departments',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'code', type: 'text' },
    { name: 'parent', type: 'relationship', relationTo: 'departments' },
    { name: 'manager', type: 'relationship', relationTo: 'employees' },
  ],
}

const Media = {
  slug: 'media',
  upload: {
    staticURL: '/media',
    staticDir: 'media',
    mimeTypes: ['image/*', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  },
  fields: [
    { name: 'alt', type: 'text' },
  ],
}

export default buildConfig({
  admin: {
    user: 'users',
    meta: {
      titleSuffix: '- AI ERP Builder',
      ogImage: '/logo.png',
      favicon: '/favicon.png',
    },
    components: {
      beforeDashboard: [],
      afterDashboard: [],
    },
  },
  collections: [Users, Products, Categories, Contacts, Companies, Opportunities, Employees, Departments, Media],
  globals: [
    {
      slug: 'settings',
      label: 'ERP Settings',
      fields: [
        { name: 'companyName', type: 'text' },
        { name: 'defaultCurrency', type: 'text', defaultValue: 'USD' },
        { name: 'dateFormat', type: 'select', options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], defaultValue: 'MM/DD/YYYY' },
      ],
    },
  ],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  editor: lexicalEditor(),
  plugins: [
    ...(process.env.BLOB_READ_WRITE_TOKEN
      ? [
          vercelBlobStorage({
            collections: {
              media: true,
            },
            token: process.env.BLOB_READ_WRITE_TOKEN,
          }),
        ]
      : []),
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
})
