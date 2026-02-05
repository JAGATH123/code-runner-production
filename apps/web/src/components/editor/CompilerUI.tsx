'use client';

import type { Problem, ExecutionResult, SubmissionResult, TestCase, FileInfo } from '@/lib/types';
import { useState, useTransition, useEffect, useCallback } from 'react';
import { CodeEditor } from './CodeEditor';
import { PygameCanvas } from './PygameCanvas';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader, Play, Send, CheckCircle, XCircle, Clock, FileInput, FileOutput, Terminal, Target, Zap, Database, Activity, Cpu, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProgress } from '@/lib/utilities/progress';
import Link from 'next/link';
import { api } from '@/lib/api-client';

interface CompilerUIProps {
  problem: Problem;
}

const statusColors = {
  Success: 'bg-neon-green',
  Error: 'bg-red-500',
  Accepted: 'bg-neon-green',
  'Wrong Answer': 'bg-red-500',
  '': 'bg-transparent',
};

const difficultyColor: { [key in Problem['difficulty']]: string } = {
  Intro: 'text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600/40 bg-blue-50 dark:bg-blue-950/20',
  Easy: 'text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/20',
  Medium: 'text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600/40 bg-amber-50 dark:bg-amber-950/20',
  Hard: 'text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-600/40 bg-rose-50 dark:bg-rose-950/20',
};

export function CompilerUI({ problem }: CompilerUIProps) {
  console.log('CompilerUI received problem:', {
    problem_id: problem.problem_id,
    title: problem.title,
    has_case_code: !!problem.case_code,
    case_code_length: problem.case_code?.length || 0
  });

  const [code, setCode] = useState<string>(problem.compiler_comment || '# Write your code here\n');
  const [customInput, setCustomInput] = useState<string>(problem.sample_input);
  const [result, setResult] = useState<ExecutionResult>({
    stdout: '',
    stderr: '',
    status: '',
    executionTime: null,
  });
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [pygameConsoleOutput, setPygameConsoleOutput] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<{ name: string; content: string } | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [userSessionId, setUserSessionId] = useState<string>('');

  // Initialize or retrieve user session ID from localStorage
  useEffect(() => {
    const getOrCreateSessionId = () => {
      let sessionId = localStorage.getItem('user_file_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('user_file_session_id', sessionId);
      }
      return sessionId;
    };

    setUserSessionId(getOrCreateSessionId());
  }, []);

  // Memoize console output handler to prevent duplicate event listeners
  // Also prevent duplicate messages from appearing in console output
  const handleConsoleOutput = useCallback((message: string) => {
    setPygameConsoleOutput(prev => {
      // Only add message if it's not already in the output (deduplication)
      if (prev.includes(message)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedImages(prev => [...prev, ...files]);
    }
  };

  // Remove uploaded image
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle file click to view contents
  const handleFileClick = async (fileName: string, filePath: string) => {
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });

      const data = await response.json();

      if (response.ok) {
        setSelectedFile({ name: fileName, content: data.content });
        setIsFileViewerOpen(true);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load file',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load file content',
        variant: 'destructive',
      });
    }
  };

  // Handle file download
  const handleFileDownload = async (fileName: string, filePath: string) => {
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });

      const data = await response.json();

      if (response.ok) {
        // Create a blob and download link
        const blob = new Blob([data.content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Success',
          description: `Downloaded ${fileName}`,
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to download file',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  // Handle file deletion
  const handleFileDelete = async (fileName: string, filePath: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });

      const data = await response.json();

      if (response.ok) {
        // Reload persistent files
        await loadPersistentFiles();

        toast({
          title: 'Success',
          description: `Deleted ${fileName}`,
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete file',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive',
      });
    }
  };

  const { playProjectTextSound } = useGlobalAudio();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('customInput');
  const [problemTestCases, setProblemTestCases] = useState<TestCase[]>([]);
  const { toast } = useToast();
  const progress = useProgress();

  // Check if this is a file handling session (Level 4, Sessions 4-8: session_ids 37-41)
  const isFileHandlingSession = problem.session_id >= 37 && problem.session_id <= 41;

  // Load persistent files for file handling sessions
  const loadPersistentFiles = useCallback(async () => {
    if (!isFileHandlingSession || !userSessionId) return;

    try {
      const response = await fetch('/api/files/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userSessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.files && data.files.length > 0) {
          setResult(prev => ({ ...prev, files: data.files }));
        }
      }
    } catch (error) {
      console.error('Failed to load persistent files:', error);
    }
  }, [isFileHandlingSession, userSessionId]);

  // Load persistent files on mount
  useEffect(() => {
    loadPersistentFiles();
  }, [loadPersistentFiles]);

  // Auto-switch to FILES tab when files are detected
  useEffect(() => {
    if (isFileHandlingSession && result.files && result.files.length > 0) {
      setActiveTab('files');
    }
  }, [isFileHandlingSession, result.files]);

  useEffect(() => {
    async function loadTestCases() {
      try {
        // Use API client to fetch from backend API service
        console.log('[CompilerUI] Fetching test cases for problem:', problem.problem_id);
        const cases = await api.problems.getTestCases(problem.problem_id);
        console.log('[CompilerUI] Received test cases:', cases.length);
        setProblemTestCases(cases);
      } catch (error) {
        console.error('[CompilerUI] Failed to load test cases:', error);
      }
    }
    loadTestCases();
  }, [problem.problem_id]);

  const handleRunCode = () => {
    startTransition(async () => {
      setResult({ stdout: '', stderr: '', status: 'Running', executionTime: null });
      setSubmissionResult(null);
      setPygameConsoleOutput([]); // Clear previous pygame console output
      setActiveTab('result');

      try {
        // Convert uploaded images to base64
        const images = await Promise.all(
          uploadedImages.map(async (file) => {
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
            return {
              name: file.name,
              data: base64
            };
          })
        );

        // Submit code to queue-based API (returns jobId)
        const submission = await api.execution.submit(
          code,
          customInput,
          images,
          isFileHandlingSession ? userSessionId : undefined
        );

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

        // If Pygame game with initial stdout, add it to pygame console output
        if (data.pygameBundle && data.stdout) {
          const initialOutput = data.stdout.trim().split('\n');
          setPygameConsoleOutput(initialOutput);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Execution failed';
        setResult({
          stdout: '',
          stderr: errorMessage,
          status: 'Error',
          executionTime: null
        });
      }
    });
  };

  const handleSubmitCode = () => {
     startTransition(async () => {
      setResult({ stdout: '', stderr: '', status: 'Submitting', executionTime: null });
      setSubmissionResult(null);
      setPygameConsoleOutput([]); // Clear previous pygame console output
      setActiveTab('result');

      try {
        // Submit code for grading via queue-based API
        const submission = await api.execution.submitForGrading(code, problem.problem_id);

        // Poll for grading result
        setResult({ stdout: '', stderr: '', status: 'Grading...', executionTime: null });
        const resultData = await api.execution.waitForResult(submission.jobId);

        // Extract submission result
        const submissionSummary = resultData.submissionResult || resultData.result?.summary;

        if (submissionSummary) {
          setSubmissionResult(submissionSummary);

          // Mark problem and level as completed if all tests pass
          if (submissionSummary.status === 'Accepted') {
            progress.markProblemComplete(problem.problem_id);
            progress.markLevelComplete(problem.age_group, problem.level_number);
          }

          toast({
            title: `Submission ${submissionSummary.status}`,
            description: `Passed ${submissionSummary.passed}/${submissionSummary.total} test cases.`,
            variant: submissionSummary.status === 'Accepted' ? 'default' : 'destructive',
          });

          // If Pygame submission with output, add to console
          const executionResult = resultData.result;
          if (executionResult?.pygameBundle && executionResult?.stdout) {
            const initialOutput = executionResult.stdout.trim().split('\n');
            setPygameConsoleOutput(initialOutput);
          }
        } else {
          throw new Error('No submission result received');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setResult({ stdout: '', stderr: errorMessage, status: 'Error', executionTime: null });
        toast({
          title: 'Submission Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    });
  };

  const renderResult = () => {
    if (isPending && (result.status === 'Running' || result.status === 'Submitting')) {
      return (
        <div className="flex flex-col items-center justify-center p-6 h-full space-y-4">
          <div className="relative">
            <Cpu className="h-10 w-10 text-neon-cyan animate-pulse" />
            <div className="absolute -inset-2 bg-neon-cyan/20 rounded-full blur animate-ping"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-space text-neon-cyan glow-text">{result.status.toUpperCase()}...</p>
            <p className="text-sm font-mono text-muted-foreground">Neural processors active</p>
          </div>
        </div>
      );
    }
    
    if (submissionResult) {
       const isAccepted = submissionResult.status === 'Accepted';
       return (
         <Alert variant={isAccepted ? 'default' : 'destructive'} className={`h-full border-2 ${isAccepted ? 'border-neon-green/50 bg-neon-green/10' : 'border-red-400/50 bg-red-400/10'}`}>
            <div className="flex items-center gap-2 mb-2">
              {isAccepted ? <CheckCircle className="h-5 w-5 text-neon-green" /> : <XCircle className="h-5 w-5 text-red-400" />}
              <span className="font-space text-xs text-neon-cyan uppercase tracking-wide">SUBMISSION STATUS</span>
            </div>
           <AlertTitle className="text-lg font-space text-primary">{submissionResult.status}</AlertTitle>
           <AlertDescription className="text-foreground mt-2">
             Mission progress: {submissionResult.passed}/{submissionResult.total} protocols executed successfully.
           </AlertDescription>
         </Alert>
       );
    }

    if (result.status === 'Success' || result.status === 'Error') {
      return (
        <div className="space-y-3">
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
                  <span>{result.executionTime.toFixed(3)}s</span>
                </div>
              )}
            </div>
            <Terminal className="h-4 w-4 text-primary/60" />
          </div>

          {/* SYSTEM OUTPUT - Shows Docker-captured print output */}
          {result.stdout && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-space text-neon-green">
                <FileOutput className="h-3 w-3" />
                <span>SYSTEM OUTPUT</span>
              </div>
              <div className="terminal-glow rounded-lg p-4">
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
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <pre className="font-code text-sm text-red-300 whitespace-pre-wrap leading-relaxed">
                  {result.stderr}
                </pre>
              </div>
            </div>
          )}
          
          {result.plots && result.plots.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-space text-neon-purple">
                <Target className="h-3 w-3" />
                <span>VISUAL OUTPUT</span>
              </div>
              <div className="space-y-3">
                {result.plots.map((plot, index) => (
                  <div key={index} className="bg-space-gray/20 border border-neon-purple/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-neon-purple">Visual {index + 1}</span>
                    </div>
                    <div>
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

          {/* Display images from result.files (new ExecutionFile format) */}
          {result.files && result.files.some((f: any) => f.type === 'image' && f.data) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-space text-neon-purple">
                <Target className="h-3 w-3" />
                <span>VISUAL OUTPUT</span>
              </div>
              <div className="space-y-3">
                {result.files
                  .filter((f: any) => f.type === 'image' && f.data)
                  .map((file: any, index: number) => (
                    <div key={index} className="bg-space-gray/20 border border-neon-purple/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-neon-purple">{file.name || `Plot ${index + 1}`}</span>
                      </div>
                      <div>
                        <img
                          src={`data:${file.mimeType || 'image/png'};base64,${file.data}`}
                          alt={file.name || `Visual output ${index + 1}`}
                          className="w-full h-auto rounded border border-neon-purple/20"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {result.pygameBundle && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-space text-neon-cyan">
                <Zap className="h-3 w-3 animate-pulse" />
                <span>INTERACTIVE PYGAME</span>
              </div>
              <PygameCanvas
                bundle={result.pygameBundle}
                onConsoleOutput={handleConsoleOutput}
              />
              {/* Always show CONSOLE OUTPUT for Pygame sessions */}
              <div className="mt-4">
                <div className="flex items-center gap-2 text-xs font-space text-foreground mb-2">
                  <Terminal className="h-3 w-3" />
                  <span>CONSOLE OUTPUT</span>
                </div>
                <pre className="font-mono text-sm bg-black p-4 rounded border border-gray-700 overflow-auto max-h-40 text-white">
                  {pygameConsoleOutput.length > 0 ? pygameConsoleOutput.join('\n') : '(Waiting for print output...)'}
                </pre>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
        <div>
          <p className="font-space text-muted-foreground">AWAITING EXECUTION</p>
          <p className="text-xs font-mono text-muted-foreground/60 mt-1">
            Initialize neural compiler to display results
          </p>
        </div>
      </div>
    );
  };

  const difficultyVariant: { [key in Problem['difficulty']]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    Intro: 'outline',
    Easy: 'default',
    Medium: 'secondary',
    Hard: 'destructive',
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className="md:w-1/3 lg:w-2/5 p-6 overflow-y-auto border-r border-primary/20 bg-card">
        {/* Back to Sessions Button */}
        <Link href={
          problem.session_id === 'code_convergence'
            ? `/levels/${problem.age_group}/${problem.level_number}#code-convergence`
            : `/levels/${problem.age_group}/${problem.level_number}#session-${problem.session_id}`
        }>
          <Button variant="ghost" className="mb-6 hover:bg-blue-500/10 font-space font-semibold uppercase tracking-wide text-sm" style={{ color: 'rgb(0, 191, 255)' }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sessions
          </Button>
        </Link>

        {/* Problem Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            <Target className="h-8 w-8 text-neon-purple" />
            <div className="absolute -inset-1 bg-neon-purple/20 rounded-full blur animate-pulse"></div>
          </div>
          <div className="flex-grow">
            <h1 className="text-2xl font-space font-bold text-primary mb-3">
              {problem.case_title || problem.title}
            </h1>
            {problem.case_number !== 6 && (
              <Badge
                className={`font-mono text-xs ${difficultyColor[problem.difficulty]} font-semibold`}
              >
                {problem.difficulty.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        <Separator className="my-6 border-primary/30" />

        {/* Mission Briefing / Description - Story Frame (For Final Tasks and Code Convergence) */}
        {problem.description && (problem.case_number === 6 || problem.metadata?.is_code_convergence) && (
          <div className="mb-6 rounded-lg border border-blue-200 dark:border-blue-900/40 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-space text-sm font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">MISSION BRIEFING</span>
            </div>
            <div className="text-gray-800 dark:text-gray-200 text-base leading-relaxed whitespace-pre-wrap font-medium" style={{ fontFamily: (problem.case_number === 6 || problem.metadata?.is_code_convergence) ? "'Terminal Grotesque', monospace" : 'inherit', fontSize: (problem.case_number === 6 || problem.metadata?.is_code_convergence) ? '1rem' : 'inherit', lineHeight: (problem.case_number === 6 || problem.metadata?.is_code_convergence) ? '1.8' : 'inherit' }}>
              {problem.description}
            </div>
          </div>
        )}

        {/* Main Task/Question - Highlighted Frame */}
        {problem.question && (
          problem.case_number === 6 ? (
            <div className="mb-6 rounded-lg border border-sky-200 dark:border-sky-900/40 bg-sky-50/50 dark:bg-sky-950/10 overflow-hidden shadow-sm">
              <div className="p-4 flex items-center gap-2 bg-sky-100/50 dark:bg-sky-950/20">
                <Target className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span className="font-space text-sm text-sky-600 dark:text-sky-400 uppercase tracking-wide font-semibold">YOUR TASK</span>
              </div>
              <div className="px-4 pb-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap border-t border-sky-200 dark:border-sky-900/30 pt-4" style={{ fontFamily: "'Terminal Grotesque', monospace", fontSize: '1rem', lineHeight: '1.8' }}>
                {problem.question}
              </div>
            </div>
          ) : (
            <div className="mb-6 rounded-lg border border-sky-200 dark:border-sky-900/40 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                <span className="font-space text-sm font-bold uppercase tracking-wide text-sky-600 dark:text-sky-400">YOUR TASK</span>
              </div>
              <div className="text-gray-800 dark:text-gray-200 text-base leading-relaxed whitespace-pre-wrap font-medium" style={{ fontFamily: "'Terminal Grotesque', monospace", fontSize: '1rem', lineHeight: '1.8' }}>{problem.question}</div>
            </div>
          )
        )}

        {/* Educational Content Frame - Collapsed sections */}
        {(problem.objectives || problem.concepts || problem.case_overview || problem.case_code || problem.case_explanation) && (
          <div className="mb-6 space-y-4">
            {/* Learning Objectives */}
            {problem.objectives && (
              <details className="group rounded-lg border border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/10 overflow-hidden shadow-sm">
                <summary className="cursor-pointer p-4 flex items-center justify-between hover:bg-blue-100/50 dark:hover:bg-blue-950/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-space text-sm text-blue-600 dark:text-blue-400 uppercase tracking-wide font-semibold">Learning Objectives</span>
                  </div>
                  <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-4 pb-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-sm border-t border-blue-200 dark:border-blue-900/30 pt-4">
                  {problem.objectives}
                </div>
              </details>
            )}

            {/* Key Concepts */}
            {problem.concepts && (
              <details className="group rounded-lg border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/10 overflow-hidden shadow-sm">
                <summary className="cursor-pointer p-4 flex items-center justify-between hover:bg-emerald-100/50 dark:hover:bg-emerald-950/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-space text-sm text-emerald-600 dark:text-emerald-400 uppercase tracking-wide font-semibold">Key Concepts</span>
                  </div>
                  <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-4 pb-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-sm border-t border-emerald-200 dark:border-emerald-900/30 pt-4">
                  {problem.concepts}
                </div>
              </details>
            )}

            {/* Overview (Hidden for final tasks - case_number 6) */}
            {problem.case_overview && problem.case_number !== 6 && (
              <details className="group rounded-lg border border-violet-200 dark:border-violet-900/30 bg-violet-50/50 dark:bg-violet-950/10 overflow-hidden shadow-sm">
                <summary className="cursor-pointer p-4 flex items-center justify-between hover:bg-violet-100/50 dark:hover:bg-violet-950/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    <span className="font-space text-sm text-violet-600 dark:text-violet-400 uppercase tracking-wide font-semibold">Overview</span>
                  </div>
                  <Zap className="h-4 w-4 text-violet-600 dark:text-violet-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-4 pb-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap border-t border-violet-200 dark:border-violet-900/30 pt-4" style={{ fontFamily: "'Terminal Grotesque', monospace", fontSize: '1rem', lineHeight: '1.8' }}>
                  {problem.case_overview}
                </div>
              </details>
            )}

            {/* Code Example */}
            {problem.case_code && (
              <details className="group rounded-lg border border-slate-200 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-900/10 overflow-hidden shadow-sm">
                <summary className="cursor-pointer p-4 flex items-center justify-between hover:bg-slate-100/50 dark:hover:bg-slate-900/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <span className="font-space text-sm text-slate-600 dark:text-slate-400 uppercase tracking-wide font-semibold">Code Example</span>
                  </div>
                  <Zap className="h-4 w-4 text-slate-600 dark:text-slate-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700/30 pt-4">
                  <div className="rounded-lg bg-slate-900 dark:bg-slate-950 p-4 border border-slate-700">
                    <pre className="text-xs text-emerald-400 whitespace-pre-wrap overflow-x-auto" style={{ fontFamily: "'Terminal Grotesque', monospace", fontSize: '0.9rem', lineHeight: '1.6' }}>{problem.case_code}</pre>
                  </div>
                </div>
              </details>
            )}

            {/* Detailed Explanation */}
            {problem.case_explanation && (
              <details className="group rounded-lg border border-indigo-200 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-950/10 overflow-hidden shadow-sm">
                <summary className="cursor-pointer p-4 flex items-center justify-between hover:bg-indigo-100/50 dark:hover:bg-indigo-950/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-space text-sm text-indigo-600 dark:text-indigo-400 uppercase tracking-wide font-semibold">HINT</span>
                  </div>
                  <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-4 pb-4 border-t border-indigo-200 dark:border-indigo-900/30 pt-4">
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm" style={{ fontFamily: "'Terminal Grotesque', monospace", fontSize: '1rem', lineHeight: '1.8' }}>
                    {problem.case_explanation.includes('|') && problem.case_explanation.includes('---') ? (
                      // Render as table if markdown table detected
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse font-mono text-xs border border-indigo-300 dark:border-indigo-800">
                          <thead>
                            <tr className="border-b-2 border-indigo-300 dark:border-indigo-800 bg-indigo-100 dark:bg-indigo-950/30">
                              {problem.case_explanation.split('\n').find(line => line.includes('|'))?.split('|').filter(cell => cell.trim()).map((header, i) => (
                                <th key={i} className="text-left py-2 px-3 text-indigo-700 dark:text-indigo-300 font-semibold border-r border-indigo-300 dark:border-indigo-800 last:border-r-0">{header.trim()}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {problem.case_explanation.split('\n')
                              .filter(line => line.includes('|') && !line.includes('---'))
                              .slice(1)
                              .map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-b border-indigo-200 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/20">
                                  {row.split('|').filter(cell => cell.trim()).map((cell, cellIndex) => (
                                    <td key={cellIndex} className="py-2 px-3 border-r border-indigo-200 dark:border-indigo-900 last:border-r-0">{cell.trim()}</td>
                                  ))}
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        <div className="mt-4 whitespace-pre-wrap">
                          {problem.case_explanation.split('\n\n').slice(1).join('\n\n')}
                        </div>
                      </div>
                    ) : (
                      (() => {
                        // Filter out "Input Format:" and "Output Format:" sections
                        const lines = problem.case_explanation.split('\n');
                        let filteredLines: string[] = [];
                        let skipSection = false;

                        for (let i = 0; i < lines.length; i++) {
                          const line = lines[i];

                          // Check if this line starts a section to skip
                          if (line.trim().startsWith('Input Format:') || line.trim().startsWith('Output Format:')) {
                            skipSection = true;
                            continue;
                          }

                          // Check if we've reached a new section or end of skipped section
                          // A new section typically starts with text followed by a colon, or is significantly different
                          if (skipSection && line.trim() && !line.startsWith(' ') && !line.startsWith('●') && !line.startsWith('-')) {
                            // Check if it's a new major section (ends with colon or is a header)
                            if (line.includes(':') && line.trim().length < 50) {
                              skipSection = false;
                            }
                          }

                          // If we're at an empty line after content, check if next section should be included
                          if (skipSection && line.trim() === '') {
                            // Peek ahead to see if next non-empty line is a new section to keep
                            let nextNonEmpty = '';
                            for (let j = i + 1; j < lines.length; j++) {
                              if (lines[j].trim()) {
                                nextNonEmpty = lines[j].trim();
                                break;
                              }
                            }
                            if (nextNonEmpty && !nextNonEmpty.startsWith('●') && !nextNonEmpty.startsWith('-') &&
                                !nextNonEmpty.startsWith('You ') && !nextNonEmpty.startsWith('Print ')) {
                              skipSection = false;
                            }
                          }

                          if (!skipSection) {
                            filteredLines.push(line);
                          }
                        }

                        // Clean up extra blank lines at the end
                        while (filteredLines.length > 0 && filteredLines[filteredLines.length - 1].trim() === '') {
                          filteredLines.pop();
                        }

                        return filteredLines.join('\n');
                      })()
                    )}
                  </div>
                </div>
              </details>
            )}
          </div>
        )}

        <Tabs defaultValue="sample" className="mt-6">
            <TabsList className="bg-space-gray/30 border border-primary/20">
                <TabsTrigger 
                  value="sample" 
                  className="font-space data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan"
                >
                  <FileInput className="w-4 h-4 mr-1" />
                  SAMPLE DATA
                </TabsTrigger>
                <TabsTrigger 
                  value="cases" 
                  className="font-space data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green"
                >
                  <Database className="w-4 h-4 mr-1" />
                  TEST PROTOCOLS
                </TabsTrigger>
            </TabsList>
            <TabsContent value="sample" className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileInput className="h-3 w-3 text-neon-cyan" />
                    <span className="font-space text-xs text-neon-cyan uppercase tracking-wide">INPUT DATA</span>
                  </div>
                  <div className="terminal-glow rounded-lg p-3">
                    <pre className="font-code text-sm text-neon-cyan whitespace-pre-wrap" style={{ fontFamily: problem.case_number === 6 ? "'Terminal Grotesque', monospace" : 'inherit', fontSize: problem.case_number === 6 ? '0.9rem' : 'inherit', lineHeight: problem.case_number === 6 ? '1.6' : 'inherit' }}>
                      {problem.sample_input || 'No user input required'}
                    </pre>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileOutput className="h-3 w-3 text-neon-green" />
                    <span className="font-space text-xs text-neon-green uppercase tracking-wide">EXPECTED OUTPUT</span>
                  </div>
                  <div className="terminal-glow rounded-lg p-3">
                    <pre className="font-code text-sm text-neon-green whitespace-pre-wrap" style={{ fontFamily: problem.case_number === 6 ? "'Terminal Grotesque', monospace" : 'inherit', fontSize: problem.case_number === 6 ? '0.9rem' : 'inherit', lineHeight: problem.case_number === 6 ? '1.6' : 'inherit' }}>{problem.sample_output}</pre>
                  </div>
                </div>
            </TabsContent>
            <TabsContent value="cases">
                <Card className="bg-card border-primary/30">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-primary/20">
                                    <TableHead className="font-space text-neon-cyan">INPUT</TableHead>
                                    <TableHead className="font-space text-neon-green">EXPECTED OUTPUT</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {problemTestCases.slice(0, 5).map((testCase, index) => (
                                <TableRow key={index} className="border-primary/10">
                                    <TableCell className="font-code text-xs">
                                        <pre className="whitespace-pre-wrap text-neon-cyan">{testCase?.input ? String(testCase.input).replace(/\\n/g, '\n') : ''}</pre>
                                    </TableCell>
                                    <TableCell className="font-code text-xs">
                                        <pre className="whitespace-pre-wrap text-neon-green">{testCase?.expected_output ? String(testCase.expected_output).replace(/\\n/g, '\n') : ''}</pre>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>

      <div className="md:w-2/3 lg:w-3/5 bg-card overflow-y-auto">
        <div className="flex flex-col">
          {/* Code Editor Header */}
          <div className="flex items-center justify-between p-4 border-b border-primary/20 bg-card/20">
            <div className="flex items-center gap-3">

              <span className="font-space text-sm text-neon-cyan uppercase tracking-wide">NEURAL CODE EDITOR</span>
            </div>
            {/* <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
              <span className="font-mono text-xs text-neon-green">READY</span>
            </div> */}
          </div>

          <div className="flex flex-col">
            <div className="p-1 bg-space-gray/30 border-b border-primary/20 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-neon-green rounded-full"></div>

            </div>
            <div className="h-96">
              <CodeEditor language="python" value={code} onChange={(v) => setCode(v || '')} />
            </div>
          </div>
          <div className="p-4 border-t border-primary/20 bg-card/20">
            {/* Image Upload Section for Pygame - Only show if compiler_comment exists and not problem 181 or 198 */}
            {problem.compiler_comment && problem.problem_id !== 181 && problem.problem_id !== 198 && (
              <div className="mb-4">
                <label className="block text-xs font-space font-bold text-foreground mb-2">
                  Upload Images (for Pygame - .png, .jpg)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    multiple
                    onChange={handleImageUpload}
                    className="text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-neon-purple/20 file:text-neon-purple hover:file:bg-neon-purple/30"
                  />
                </div>
                {uploadedImages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 bg-card/40 px-3 py-1 rounded border border-neon-purple/30">
                        <span className="text-xs text-foreground">{file.name}</span>
                        <button
                          onClick={() => removeImage(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-3 mb-3">
            <Button
              variant="secondary"
              onClick={() => {
                playProjectTextSound();
                handleRunCode();
              }}
              disabled={isPending}
              className="bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan border border-neon-cyan/50 font-space font-semibold"
            >
              {isPending && result.status === 'Running' ?
                <Loader className="mr-2 h-4 w-4 animate-spin" /> :
                <Play className="mr-2 h-4 w-4" />
              }
              TEST RUN
            </Button>
            <Button
              onClick={() => {
                playProjectTextSound();
                handleSubmitCode();
              }}
              disabled={isPending}
              className="bg-neon-green/20 hover:bg-neon-green/30 text-neon-green border border-neon-green/50 font-space font-semibold glow-border"
            >
               {isPending && result.status === 'Submitting' ?
                 <Loader className="mr-2 h-4 w-4 animate-spin" /> :
                 <Send className="mr-2 h-4 w-4" />
               }
              SUBMIT MISSION
            </Button>
            <Button
              onClick={() => {
                playProjectTextSound();
                const nextProblemId = problem.problem_id + 1;
                window.location.href = `/problems/${nextProblemId}`;
              }}
              disabled={!submissionResult || submissionResult.status !== 'Accepted'}
              className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50 font-space font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              NEXT TASK
            </Button>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-space-gray/30 border border-primary/20">
              <TabsTrigger
                value="customInput"
                className="font-space data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan"
              >
                <FileInput className="w-4 h-4 mr-1" />
                INPUT
              </TabsTrigger>
              <TabsTrigger
                value="result"
                className="font-space data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green"
              >
                <FileOutput className="w-4 h-4 mr-1" />
                OUTPUT
              </TabsTrigger>
              {isFileHandlingSession && (
                <TabsTrigger
                  value="files"
                  className="font-space data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple"
                >
                  <Database className="w-4 h-4 mr-1" />
                  FILES {result.files && result.files.length > 0 ? `(${result.files.length})` : ''}
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="customInput" className="mt-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileInput className="h-3 w-3 text-neon-cyan" />
                  <span className="font-space text-xs text-neon-cyan uppercase tracking-wide">SYSTEM INPUT</span>
                </div>
                <Textarea
                  placeholder="// Enter input data here"
                  className="font-code min-h-32 bg-deep-space border border-neon-cyan/30 text-neon-cyan placeholder:text-muted-foreground/60 terminal-glow resize-none"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                />
              </div>
            </TabsContent>
            <TabsContent value="result" className="mt-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileOutput className="h-3 w-3 text-neon-green" />
                  <span className="font-space text-xs text-neon-green uppercase tracking-wide">EXECUTION RESULTS</span>
                </div>
                <Card className="flex-grow overflow-hidden bg-card">
                  <CardContent className="p-4 h-full">
                      {renderResult()}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            {isFileHandlingSession && (
              <TabsContent value="files" className="mt-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-3 w-3 text-neon-purple" />
                    <span className="font-space text-xs text-neon-purple uppercase tracking-wide">FILE EXPLORER</span>
                  </div>
                  <Card className="flex-grow overflow-hidden bg-card">
                    <CardContent className="p-4 h-full">
                      {result.files && result.files.length > 0 ? (
                        <div className="space-y-2">
                          {result.files.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 rounded-lg bg-space-gray/30 border border-neon-purple/30"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-8 h-8 flex items-center justify-center bg-neon-purple/20 rounded border border-neon-purple/40">
                                  <FileOutput className="h-4 w-4 text-neon-purple" />
                                </div>
                                <div className="text-left flex-1">
                                  <div className="font-mono text-sm text-foreground">
                                    {file.name}
                                  </div>
                                  <div className="font-mono text-xs text-muted-foreground">
                                    {(file.size / 1024).toFixed(2)} KB
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleFileClick(file.name, file.path)}
                                  className="h-8 px-2 text-xs hover:bg-neon-cyan/20 hover:text-neon-cyan"
                                >
                                  <FileOutput className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleFileDownload(file.name, file.path)}
                                  className="h-8 px-2 text-xs hover:bg-neon-green/20 hover:text-neon-green"
                                >
                                  <ArrowRight className="h-3 w-3 mr-1 rotate-90" />
                                  Download
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleFileDelete(file.name, file.path)}
                                  className="h-8 px-2 text-xs hover:bg-red-500/20 hover:text-red-400"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                          <Database className="h-12 w-12 text-muted-foreground/40 mb-3" />
                          <p className="font-space text-sm text-muted-foreground">
                            No files created yet
                          </p>
                          <p className="font-mono text-xs text-muted-foreground/60 mt-1">
                            Run your code to create files
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
            </Tabs>
          </div>
        </div>
      </div>

      {/* File Viewer Modal */}
      <Dialog open={isFileViewerOpen} onOpenChange={setIsFileViewerOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] bg-card border-neon-purple/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-space text-neon-purple">
              <FileOutput className="h-5 w-5" />
              {selectedFile?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-deep-space border border-neon-purple/30 rounded-lg p-4 max-h-[60vh] overflow-auto">
              <pre className="font-code text-sm text-foreground whitespace-pre-wrap">
                {selectedFile?.content}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
