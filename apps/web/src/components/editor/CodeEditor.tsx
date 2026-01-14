'use client';

import Editor, { OnChange } from '@monaco-editor/react';
import { Loader } from 'lucide-react';

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: OnChange;
}

export function CodeEditor({ language, value, onChange }: CodeEditorProps) {
  return (
    <Editor
      height="100%"
      language={language}
      theme="vs-dark"
      value={value}
      onChange={onChange}
      loading={<Loader className="h-8 w-8 animate-spin" />}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        contextmenu: true,
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
    />
  );
}
