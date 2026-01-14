
import { Header } from '@/components/layout/Header';
import { FreeCompiler } from '@/components/editor/FreeCompiler';
import { Terminal, Zap, Code, Activity } from 'lucide-react';

export default function CompilerPage() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <Header />
      
      <main className="flex-grow flex flex-col relative z-10">
        {/* Terminal Header */}
        <div className="border-b border-primary/20 bg-card/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Terminal className="h-8 w-8 text-neon-green" />
                    <div className="absolute -inset-1 bg-neon-green/20 rounded blur"></div>
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-space font-bold text-primary glow-text">
                      NEURAL COMPILER
                    </h1>
                    <p className="text-sm font-mono text-neon-cyan opacity-80">
                      Advanced Python Execution Environment
                    </p>
                  </div>
                </div>
              </div>
              
              {/* System Status */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-3 py-2 rounded bg-space-gray/50 border border-neon-green/30">
                  <Activity className="w-4 h-4 text-neon-green animate-pulse" />
                  <span className="text-sm font-mono text-neon-green">READY</span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-2 rounded bg-space-gray/50 border border-neon-cyan/30">
                  <Zap className="w-4 h-4 text-neon-cyan" />
                  <span className="text-sm font-mono text-neon-cyan">PYTHON 3.11</span>
                </div>
                <div className="flex items-center space-x-2 px-3 py-2 rounded bg-space-gray/50 border border-neon-purple/30">
                  <Code className="w-4 h-4 text-neon-purple" />
                  <span className="text-sm font-mono text-neon-purple">SANDBOX</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-grow min-h-0">
          <FreeCompiler />
        </div>
      </main>
    </div>
  );
}
