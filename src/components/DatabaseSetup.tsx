'use client';

import { useState } from 'react';
import { erpModules, getModule, generateSupabaseSQL, generateCassandraCQL } from '@/lib/modules';
import { Database, Server, Copy, Check, Download, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import Editor from '@monaco-editor/react';
import { toast } from 'sonner';

export function DatabaseSetup() {
  const [selectedModule, setSelectedModule] = useState<string>('inventory');
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'supabase' | 'cassandra'>('supabase');

  const module = getModule(selectedModule);
  const supabaseSQL = module ? generateSupabaseSQL(module) : '';
  const cassandraCQL = module ? generateCassandraCQL(module) : '';

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-600" />
          Database Setup
        </h1>
        <p className="text-gray-600">
          Generate database schemas for your ERP modules. Use Supabase for primary data and Cassandra for high-load time-series data.
        </p>
      </div>

      {/* Module Selection */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">Select Module</h2>
        <div className="grid grid-cols-4 gap-4">
          {Object.values(erpModules).map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedModule(m.id)}
              className={cn(
                "p-4 border rounded-lg text-left transition-all",
                selectedModule === m.id
                  ? "border-blue-500 bg-blue-50"
                  : "hover:border-gray-300"
              )}
            >
              <h3 className="font-semibold mb-1">{m.name}</h3>
              <p className="text-xs text-gray-500">{m.databaseStrategy}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Database Tabs */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('supabase')}
            className={cn(
              "px-6 py-3 font-medium text-sm flex items-center gap-2",
              activeTab === 'supabase'
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <Server className="w-4 h-4" />
            Supabase (PostgreSQL)
            <span className="ml-2 px-2 py-0.5 bg-gray-200 rounded text-xs">
              {module?.supabaseTables.length} tables
            </span>
          </button>
          <button
            onClick={() => setActiveTab('cassandra')}
            className={cn(
              "px-6 py-3 font-medium text-sm flex items-center gap-2",
              activeTab === 'cassandra'
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <Database className="w-4 h-4" />
            Cassandra
            <span className="ml-2 px-2 py-0.5 bg-gray-200 rounded text-xs">
              {module?.cassandraTables.length} tables
            </span>
          </button>
        </div>

        <div className="h-[500px]">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
            <span className="font-mono text-sm">
              {activeTab === 'supabase' ? 'schema.sql' : 'schema.cql'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(
                  activeTab === 'supabase' ? supabaseSQL : cassandraCQL,
                  'schema'
                )}
                className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 flex items-center gap-1"
              >
                {copied === 'schema' ? (
                  <>
                    <Check className="w-4 h-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy
                  </>
                )}
              </button>
              <button
                onClick={() => handleDownload(
                  activeTab === 'supabase' ? supabaseSQL : cassandraCQL,
                  activeTab === 'supabase' ? 'supabase_schema.sql' : 'cassandra_schema.cql'
                )}
                className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 flex items-center gap-1"
              >
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>
          <Editor
            height="calc(100% - 40px)"
            language={activeTab === 'supabase' ? 'sql' : 'sql'}
            value={activeTab === 'supabase' ? supabaseSQL : cassandraCQL}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            }}
            theme="vs-light"
          />
        </div>
      </div>

      {/* Database Strategy Info */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Server className="w-5 h-5" />
            Supabase (PostgreSQL)
          </h3>
          <p className="text-sm text-blue-800 mb-3">
            Primary database for structured data with relationships
          </p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• User profiles, authentication</li>
            <li>• Master data (products, contacts, employees)</li>
            <li>• Relational data with foreign keys</li>
            <li>• Real-time subscriptions</li>
            <li>• Row Level Security (RLS)</li>
          </ul>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Cassandra
          </h3>
          <p className="text-sm text-green-800 mb-3">
            High-throughput database for time-series and high-load data
          </p>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Inventory transactions (1000+/sec)</li>
            <li>• CRM activity logs and interactions</li>
            <li>• Financial journal entries</li>
            <li>• Time-series data with clustering</li>
            <li>• Immutable audit trails</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
