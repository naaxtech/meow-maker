export default function DashboardPage() {
  const stats = [
    { name: 'Total Modules', value: '4', change: '+0', changeType: 'neutral' },
    { name: 'Generated Files', value: '0', change: 'Ready to build', changeType: 'neutral' },
    { name: 'Database Tables', value: '0', change: 'Supabase + Cassandra', changeType: 'neutral' },
    { name: 'Status', value: 'Ready', change: 'Start building', changeType: 'positive' },
  ];

  const quickActions = [
    { name: 'AI Builder', description: 'Generate an ERP app from a prompt', href: '/builder', color: 'bg-blue-500' },
    { name: 'Database Setup', description: 'Configure Supabase and Cassandra schemas', href: '/database', color: 'bg-green-500' },
    { name: 'Module Manager', description: 'Enable/disable ERP modules', href: '/modules', color: 'bg-purple-500' },
  ];

  const modules = [
    { name: 'Inventory', description: 'Stock management, warehouses, products', status: 'available', icon: '📦' },
    { name: 'CRM', description: 'Contacts, leads, opportunities', status: 'available', icon: '👥' },
    { name: 'Accounting', description: 'Invoices, payments, financial reports', status: 'available', icon: '💰' },
    { name: 'HR', description: 'Employees, attendance, payroll', status: 'available', icon: '👔' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to AI ERP Builder</h1>
        <p className="text-gray-600">
          Generate complete ERP applications with AI-powered code generation.
          <br />
          Dual-database architecture: Supabase for primary data, Cassandra for high-load time-series.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-lg border">
            <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className={
              stat.changeType === 'positive' 
                ? 'text-sm text-green-600' 
                : stat.changeType === 'negative'
                ? 'text-sm text-red-600'
                : 'text-sm text-gray-500'
            }>
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="col-span-2">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <a
                key={action.name}
                href={action.href}
                className="p-6 rounded-lg border hover:border-blue-500 hover:shadow-md transition-all group"
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg mb-4 flex items-center justify-center`}>
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold group-hover:text-blue-600">{action.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{action.description}</p>
              </a>
            ))}
          </div>

          {/* Getting Started */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
            <ol className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
                Configure your database connections (Supabase & Cassandra)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
                Go to AI Builder and describe the ERP app you want
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">3</span>
                Review and customize the generated code
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">4</span>
                Deploy your application
              </li>
            </ol>
          </div>
        </div>

        {/* Available Modules */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Available Modules</h2>
          <div className="space-y-3">
            {modules.map((module) => (
              <div key={module.name} className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{module.icon}</span>
                  <div>
                    <h3 className="font-semibold">{module.name}</h3>
                    <p className="text-sm text-gray-500">{module.description}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      {module.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
