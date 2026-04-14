'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { generateApp, parseGeneratedCode } from '@/lib/ai';
import { templates, listTemplates, getTemplate } from '@/lib/templates';
import { erpModules, listModules, getModule } from '@/lib/modules';
import { Sparkles, Send, Loader2, Code, Database, Layout, Check, ChevronDown, Terminal, FileCode, Play, Settings, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import Editor from '@monaco-editor/react';

interface BuilderMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'code' | 'files' | 'sql' | 'cql';
  files?: Array<{ type: 'write' | 'edit' | 'delete'; path: string; content: string }>;
}

export function AIBuilder() {
  const [messages, setMessages] = useState<BuilderMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('base');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showModules, setShowModules] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'preview' | 'files'>('chat');
  const [generatedFiles, setGeneratedFiles] = useState<Array<{ path: string; content: string }>>([]);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const modulesList = listModules();
  const templatesList = listTemplates();

  const generateMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await generateApp(prompt, {
        modules: selectedModules,
        databaseStrategy: 'hybrid',
        stream: false
      });
      return response as string;
    },
    onSuccess: (response) => {
      const files = parseGeneratedCode(response);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I\'ve generated your ERP application. Here\'s what I created:',
        type: files.length > 0 ? 'files' : 'text',
        files: files
      }]);

      // Store generated files for preview
      const fileList = files
        .filter(f => f.type === 'write')
        .map(f => ({ path: f.path, content: f.content }));
      setGeneratedFiles(fileList);
      
      if (fileList.length > 0) {
        setPreviewFile(fileList[0].path);
        setActiveTab('files');
      }
      
      setIsGenerating(false);
    },
    onError: (error) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: `Error: ${error.message}`,
        type: 'text'
      }]);
      setIsGenerating(false);
    }
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessage: BuilderMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    generateMutation.mutate(input);
  };

  const handleQuickStart = (type: 'inventory' | 'crm' | 'accounting' | 'hr' | 'full') => {
    const prompts: Record<string, string> = {
      inventory: 'Create a complete inventory management system with multi-warehouse support, barcode scanning, and stock tracking',
      crm: 'Build a CRM system with contact management, sales pipeline, and activity tracking',
      accounting: 'Create an accounting module with chart of accounts, invoicing, and financial reporting',
      hr: 'Build an HR management system with employee directory, attendance tracking, and payroll',
      full: 'Create a complete ERP system with inventory, CRM, accounting, and HR modules integrated together'
    };

    const modulesMap: Record<string, string[]> = {
      inventory: ['inventory'],
      crm: ['crm'],
      accounting: ['accounting'],
      hr: ['hr'],
      full: ['inventory', 'crm', 'accounting', 'hr']
    };

    setSelectedModules(modulesMap[type]);
    setInput(prompts[type]);
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const previewFileContent = generatedFiles.find(f => f.path === previewFile)?.content || '';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            AI ERP Builder
          </h1>
        </div>

        {/* Quick Start */}
        <div className="p-4 border-b">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">Quick Start</h2>
          <div className="space-y-2">
            {(['inventory', 'crm', 'accounting', 'hr', 'full'] as const).map(type => (
              <button
                key={type}
                onClick={() => handleQuickStart(type)}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 flex items-center gap-2 capitalize"
              >
                {type === 'full' ? <Layers className="w-4 h-4" /> : <Layout className="w-4 h-4" />}
                {type === 'full' ? 'Full ERP System' : `${type} Module`}
              </button>
            ))}
          </div>
        </div>

        {/* Module Selection */}
        <div className="p-4 border-b flex-1">
          <button
            onClick={() => setShowModules(!showModules)}
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-500 mb-2"
          >
            <span className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Modules
            </span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", showModules && "rotate-180")} />
          </button>
          
          {showModules && (
            <div className="space-y-2 mt-2">
              {modulesList.map(module => {
                const isSelected = selectedModules.includes(module.id);
                return (
                  <label
                    key={module.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-gray-100",
                      isSelected && "bg-blue-50 hover:bg-blue-100"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleModule(module.id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{module.name}</p>
                      <p className="text-xs text-gray-500">{module.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Template Selection */}
        <div className="p-4">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-500 mb-2"
          >
            <span className="flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              Template
            </span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", showTemplates && "rotate-180")} />
          </button>
          
          {showTemplates && (
            <div className="space-y-1 mt-2">
              {templatesList.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded",
                    selectedTemplate === template.id
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-100"
                  )}
                >
                  {template.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-2 bg-white border-b">
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded flex items-center gap-2",
              activeTab === 'chat'
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Terminal className="w-4 h-4" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded flex items-center gap-2",
              activeTab === 'files'
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Code className="w-4 h-4" />
            Files
            {generatedFiles.length > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {generatedFiles.length}
              </span>
            )}
          </button>
        </div>

        {/* Chat View */}
        {activeTab === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Sparkles className="w-12 h-12 text-blue-500 mb-4" />
                  <h2 className="text-2xl font-bold mb-2">AI ERP Builder</h2>
                  <p className="text-gray-500 max-w-md mb-6">
                    Describe the ERP application you want to build. I\'ll generate a complete,
                    production-ready application with Supabase and Cassandra integration.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {[
                      'Inventory with barcode scanning',
                      'CRM with sales pipeline',
                      'Accounting with invoicing',
                      'HR with attendance tracking',
                      'Full ERP system'
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(`Create ${suggestion}`)}
                        className="px-4 py-2 bg-white border rounded-full text-sm hover:bg-gray-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-4",
                        message.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg p-4",
                          message.role === 'user'
                            ? "bg-blue-600 text-white"
                            : message.role === 'system'
                            ? "bg-red-100 text-red-800"
                            : "bg-white border shadow-sm"
                        )}
                      >
                        {message.type === 'files' && message.files ? (
                          <div>
                            <p className="mb-2">{message.content}</p>
                            <div className="space-y-1">
                              {message.files.map((file, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 text-sm bg-gray-100 rounded px-2 py-1"
                                >
                                  {file.type === 'write' && <Code className="w-4 h-4 text-green-600" />}
                                  {file.type === 'edit' && <Settings className="w-4 h-4 text-blue-600" />}
                                  {file.type === 'delete' && <Check className="w-4 h-4 text-red-600" />}
                                  <span className="font-mono text-xs truncate">{file.path}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p>{message.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {isGenerating && (
                    <div className="flex justify-start">
                      <div className="bg-white border shadow-sm rounded-lg p-4 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-gray-600">Generating your ERP application...</span>
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t">
              <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe the ERP app you want to build..."
                    className="flex-1 p-3 border rounded-lg resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isGenerating || !input.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </form>
            </div>
          </>
        )}

        {/* Files View */}
        {activeTab === 'files' && (
          <div className="flex-1 flex">
            {/* File Tree */}
            <div className="w-64 bg-gray-50 border-r overflow-y-auto">
              <div className="p-4">
                <h3 className="font-semibold mb-4">Generated Files</h3>
                <div className="space-y-1">
                  {generatedFiles.map(file => (
                    <button
                      key={file.path}
                      onClick={() => setPreviewFile(file.path)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2",
                        previewFile === file.path
                          ? "bg-blue-100 text-blue-700"
                          : "hover:bg-gray-200"
                      )}
                    >
                      <FileCode className="w-4 h-4" />
                      <span className="truncate">{file.path.split('/').pop()}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* File Preview */}
            <div className="flex-1 flex flex-col">
              {previewFile ? (
                <>
                  <div className="px-4 py-2 bg-gray-100 border-b flex items-center justify-between">
                    <span className="font-mono text-sm">{previewFile}</span>
                    <button className="text-sm text-blue-600 hover:underline">
                      Copy
                    </button>
                  </div>
                  <div className="flex-1">
                    <Editor
                      height="100%"
                      language={previewFile.endsWith('tsx') ? 'typescript' : previewFile.endsWith('ts') ? 'typescript' : 'javascript'}
                      value={previewFileContent}
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                      }}
                      theme="vs-light"
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a file to preview
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
