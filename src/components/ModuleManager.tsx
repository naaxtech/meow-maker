'use client';

import { useState } from 'react';
import { erpModules, ERPModule, ModuleFeature } from '@/lib/modules';
import { 
  Package, Users, DollarSign, Briefcase, 
  Settings, ToggleLeft, ToggleRight, Database, Server
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  Package,
  Users,
  DollarSign,
  Briefcase
};

export function ModuleManager() {
  const [selectedModule, setSelectedModule] = useState<string>('inventory');
  const [moduleStates, setModuleStates] = useState<Record<string, Partial<ERPModule>>>(() => {
    const states: Record<string, Partial<ERPModule>> = {};
    Object.values(erpModules).forEach(m => {
      states[m.id] = {
        features: m.features.map(f => ({ ...f }))
      };
    });
    return states;
  });

  const module = erpModules[selectedModule];
  const currentState = moduleStates[selectedModule];
  const Icon = iconMap[module.icon] || Package;

  const toggleFeature = (featureId: string) => {
    setModuleStates(prev => ({
      ...prev,
      [selectedModule]: {
        ...prev[selectedModule],
        features: prev[selectedModule]?.features?.map(f =>
          f.id === featureId ? { ...f, enabled: !f.enabled } : f
        )
      }
    }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Module Manager
        </h1>
        <p className="text-gray-600">
          Configure and customize ERP modules for your application.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Module List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">ERP Modules</h2>
          {Object.values(erpModules).map(m => {
            const ModuleIcon = iconMap[m.icon] || Package;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedModule(m.id)}
                className={cn(
                  "w-full p-4 border rounded-lg text-left transition-all flex items-start gap-3",
                  selectedModule === m.id
                    ? "border-blue-500 bg-blue-50"
                    : "hover:border-gray-300"
                )}
              >
                <div className={cn(
                  "p-2 rounded",
                  selectedModule === m.id ? "bg-blue-100" : "bg-gray-100"
                )}>
                  <ModuleIcon className={cn(
                    "w-5 h-5",
                    selectedModule === m.id ? "text-blue-600" : "text-gray-600"
                  )} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{m.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{m.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      m.databaseStrategy === 'hybrid'
                        ? "bg-purple-100 text-purple-700"
                        : m.databaseStrategy === 'supabase'
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    )}>
                      {m.databaseStrategy}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Module Details */}
        <div className="col-span-2">
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Icon className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{module.name}</h2>
                  <p className="text-gray-500">{module.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Supabase Tables</p>
                  <p className="text-lg font-semibold">{module.supabaseTables.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Cassandra Tables</p>
                  <p className="text-lg font-semibold">{module.cassandraTables.length}</p>
                </div>
              </div>
            </div>

            {/* Database Strategy */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Database Strategy</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Supabase Tables</span>
                  </div>
                  <div className="space-y-1">
                    {module.supabaseTables.map(t => (
                      <div key={t.name} className="flex items-center gap-2 text-sm text-blue-800">
                        <span className="font-mono text-xs bg-blue-200 px-1.5 rounded">SQL</span>
                        {t.name}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">Cassandra Tables</span>
                  </div>
                  <div className="space-y-1">
                    {module.cassandraTables.map(t => (
                      <div key={t.name} className="flex items-center gap-2 text-sm text-green-800">
                        <span className="font-mono text-xs bg-green-200 px-1.5 rounded">CQL</span>
                        {t.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Features</h3>
              <div className="space-y-3">
                {currentState?.features?.map((feature: ModuleFeature) => (
                  <div
                    key={feature.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      feature.enabled
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div>
                      <p className={cn(
                        "font-medium",
                        feature.enabled ? "text-blue-900" : "text-gray-700"
                      )}>
                        {feature.name}
                      </p>
                      <p className={cn(
                        "text-sm",
                        feature.enabled ? "text-blue-600" : "text-gray-500"
                      )}>
                        {feature.description}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFeature(feature.id)}
                      className={cn(
                        "p-2 rounded-full transition-colors",
                        feature.enabled
                          ? "bg-blue-200 text-blue-700 hover:bg-blue-300"
                          : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                      )}
                    >
                      {feature.enabled ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
