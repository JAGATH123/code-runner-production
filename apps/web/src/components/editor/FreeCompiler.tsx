'use client';

import type { ExecutionResult } from '@/lib/types';
import { useState, useTransition } from 'react';
import { CodeEditor } from './CodeEditor';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader, Play, Clock, Zap, FileInput, FileOutput, Terminal, Cpu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { api } from '@/lib/api-client';

const defaultCode = `# NEURAL NETWORK INITIALIZATION
def main():
    print(">> SYSTEM ONLINE - INITIALIZING PROTOCOLS...")
    name = input("Enter operative codename: ")
    print(f"Welcome to the grid, Agent {name}")
    print(">> ALL SYSTEMS OPERATIONAL")

main()
`;

export function FreeCompiler() {
  const [code, setCode] = useState<string>(defaultCode);
  const [customInput, setCustomInput] = useState<string>('');
  const [result, setResult] = useState<ExecutionResult>({
    stdout: '',
    stderr: '',
    status: '',
    executionTime: null,
  });
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('customInput');
  const { toast } = useToast();
  const { playProjectTextSound } = useGlobalAudio();

  const handleRunCode = () => {
    playProjectTextSound(); // Play deploy click sound when executing code
    startTransition(async () => {
      setResult({ stdout: '', stderr: '', status: 'Running', executionTime: null });
      setActiveTab('result');

      try {
        // Submit code to queue-based API (returns jobId)
        const submission = await api.execution.submit(code, customInput);

        // Poll for result
        setResult({ stdout: '', stderr: '', status: 'Queued...', executionTime: null });
        const resultData = await api.execution.waitForResult(submission.jobId);

        // Extract execution result from API response
        const data: ExecutionResult = resultData.result || {
          stdout: resultData.stdout || '',
          stderr: resultData.stderr || resultData.error || '',
          status: resultData.status === 'completed' ? 'Success' : 'Error',
          executionTime: resultData.executionTime || null,
        };

        setResult(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setResult({ stdout: '', stderr: errorMessage, status: 'Error', executionTime: null });
        toast({
          title: 'Execution Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    });
  };

  const renderResult = () => {
    if (isPending && result.status === 'Running') {
      return (
        <div className="flex flex-col items-center justify-center p-6 h-full space-y-4">
          <div className="relative">
            <Cpu className="h-12 w-12 text-neon-cyan animate-pulse" />
            <div className="absolute -inset-2 bg-neon-cyan/20 rounded-full blur animate-ping"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-space text-neon-cyan glow-text">EXECUTING...</p>
            <p className="text-sm font-mono text-muted-foreground">Neural processors online</p>
          </div>
        </div>
      );
    }

    if (result.status === 'Success' || result.status === 'Error') {
      return (
        <div className="space-y-3">
          {/* Status Header */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-space-gray/30 border border-primary/20">
            <div className="flex items-center gap-3">
              <Badge className={`${
                result.status === 'Success' 
                  ? 'bg-neon-green/20 text-neon-green border-neon-green/40' 
                  : 'bg-destructive/20 text-red-400 border-red-400/40'
              } font-space`}>
                {result.status === 'Success' ? 'EXECUTION SUCCESS' : 'RUNTIME ERROR'}
              </Badge>
              {result.executionTime !== null && (
                <div className="flex items-center gap-1 text-xs font-mono text-neon-cyan">
                  <Clock className="h-3 w-3" />
                  <span>{result.executionTime.toFixed(3)}ms</span>
                </div>
              )}
            </div>
            <Terminal className="h-4 w-4 text-primary/60" />
          </div>
          
          {/* Output Display */}
          {result.stdout && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-space text-neon-green">
                <FileOutput className="h-3 w-3" />
                <span>SYSTEM OUTPUT</span>
              </div>
              <div className="terminal-glow rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="font-code text-sm text-neon-green whitespace-pre-wrap leading-relaxed">
                  {result.stdout}
                </pre>
              </div>
            </div>
          )}
          
          {result.stderr && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-space text-red-400">
                <Zap className="h-3 w-3" />
                <span>ERROR LOG</span>
              </div>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="font-code text-sm text-red-300 whitespace-pre-wrap leading-relaxed">
                  {result.stderr}
                </pre>
              </div>
            </div>
          )}
          
          {result.plots && result.plots.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-space text-neon-purple">
                <Terminal className="h-3 w-3" />
                <span>VISUAL OUTPUT</span>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-3">
                {result.plots.map((plot, index) => (
                  <div key={index} className="bg-space-gray/20 border border-neon-purple/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-neon-purple">Visual {index + 1}</span>
                    </div>
                    <div className="max-h-64 overflow-auto">
                      <img
                        src={plot}
                        alt={`Visual output ${index + 1}`}
                        className="w-full h-auto rounded border border-neon-purple/20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
        <Terminal className="h-16 w-16 text-muted-foreground" />
        <div>
          <p className="font-space text-muted-foreground">AWAITING EXECUTION</p>
          <p className="text-sm font-mono text-muted-foreground/60 mt-1">
            Initialize neural compiler to display results
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Code Editor Section */}
      <div className="w-2/3 flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-neon-cyan" />
            <span className="font-space text-sm text-neon-cyan">CODE EDITOR</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
            <span className="font-mono text-xs text-neon-green">READY</span>
          </div>
        </div>
        <div className="flex-grow flex flex-col min-h-0 hologram overflow-hidden">
          <div className="p-1 bg-space-gray/30 border-b border-primary/20 flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-neon-green rounded-full"></div>
            <span className="ml-2 font-mono text-xs text-muted-foreground">neural_compiler.py</span>
          </div>
          <div className="flex-grow">
            <CodeEditor language="python" value={code} onChange={(v) => setCode(v || '')} />
          </div>
        </div>
      </div>
      
      {/* Control Panel Section */}
      <div className="w-1/3 flex flex-col">
        {/* Execute Button */}
        <div className="mb-4">
          <Button 
            onClick={handleRunCode} 
            disabled={isPending}
            className="w-full bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan border border-neon-cyan/50 font-space font-bold py-3 glow-border pulse-glow"
          >
            {isPending ? (
              <>
                <Loader className="mr-2 h-5 w-5 animate-spin" />
                EXECUTING
              </>
            ) : (
              <>
                <Zap className="mr-2 h-5 w-5" />
                EXECUTE CODE
              </>
            )}
          </Button>
        </div>
        
        {/* Control Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-2 bg-space-gray/30 border border-primary/20">
            <TabsTrigger value="customInput" className="font-space data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan">
              <FileInput className="w-4 h-4 mr-1" />
              INPUT
            </TabsTrigger>
            <TabsTrigger value="result" className="font-space data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green">
              <FileOutput className="w-4 h-4 mr-1" />
              OUTPUT
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="customInput" className="flex-grow mt-3">
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-2 px-1">
                <FileInput className="h-3 w-3 text-neon-cyan" />
                <span className="font-space text-xs text-neon-cyan">SYSTEM INPUT</span>
              </div>
              <Textarea
                placeholder="// Enter input data for your program
// Each line represents one input() call
Agent-X47"
                className="flex-grow font-code bg-deep-space border border-neon-cyan/30 text-neon-cyan placeholder:text-muted-foreground/60 terminal-glow resize-none"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="result" className="flex-grow mt-3">
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-2 px-1">
                <FileOutput className="h-3 w-3 text-neon-green" />
                <span className="font-space text-xs text-neon-green">EXECUTION RESULTS</span>
              </div>
              <Card className="flex-grow overflow-hidden hologram">
                <CardContent className="p-4 h-full overflow-y-auto">
                  {renderResult()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
