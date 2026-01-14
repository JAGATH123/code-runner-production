'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  Tooltip,
  Legend
} from 'recharts';
import { TrendingUp, Target, BarChart3, PieChart as PieChartIcon, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

// Mock data for charts
const progressData = [
  { month: 'Jan', solved: 12, easy: 8, medium: 3, hard: 1 },
  { month: 'Feb', solved: 25, easy: 15, medium: 7, hard: 3 },
  { month: 'Mar', solved: 41, easy: 22, medium: 14, hard: 5 },
  { month: 'Apr', solved: 67, easy: 35, medium: 22, hard: 10 },
  { month: 'May', solved: 89, easy: 45, medium: 29, hard: 15 },
  { month: 'Jun', solved: 123, easy: 58, medium: 41, hard: 24 },
  { month: 'Jul', solved: 156, easy: 71, medium: 58, hard: 27 },
  { month: 'Aug', solved: 187, easy: 89, medium: 73, hard: 25 }
];

const difficultyData = [
  { name: 'Easy', value: 89, color: '#10B981' },
  { name: 'Medium', value: 73, color: '#F59E0B' },
  { name: 'Hard', value: 25, color: '#EF4444' }
];

const monthlyActivity = [
  { month: 'Jan', submissions: 45, accepted: 28 },
  { month: 'Feb', submissions: 52, accepted: 31 },
  { month: 'Mar', submissions: 38, accepted: 25 },
  { month: 'Apr', submissions: 67, accepted: 42 },
  { month: 'May', submissions: 73, accepted: 48 },
  { month: 'Jun', submissions: 89, accepted: 61 },
  { month: 'Jul', submissions: 56, accepted: 38 },
  { month: 'Aug', submissions: 42, accepted: 29 }
];

export function ProblemChart() {
  const [activeChart, setActiveChart] = useState<'progress' | 'difficulty' | 'activity'>('progress');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/90 backdrop-blur-sm border border-primary/30 p-3 rounded-lg shadow-lg">
          <p className="font-space text-primary font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="font-mono text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="mission-card enhanced-hologram cyber-card glow-border">
      {/* Corner indicators */}
      <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-neon-purple/60"></div>
      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-neon-purple/60"></div>
      <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-neon-purple/60"></div>
      <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-neon-purple/60"></div>

      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-space font-bold text-primary flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-neon-purple" />
            ANALYTICS MATRIX
          </CardTitle>
          <div className="flex gap-2">
            <Badge 
              className={`cursor-pointer font-space text-xs transition-all ${
                activeChart === 'progress' 
                ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/50' 
                : 'bg-card text-muted-foreground border-primary/30 hover:border-neon-purple/50'
              }`}
              onClick={() => setActiveChart('progress')}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              PROGRESS
            </Badge>
            <Badge 
              className={`cursor-pointer font-space text-xs transition-all ${
                activeChart === 'difficulty' 
                ? 'bg-neon-green/20 text-neon-green border-neon-green/50' 
                : 'bg-card text-muted-foreground border-primary/30 hover:border-neon-green/50'
              }`}
              onClick={() => setActiveChart('difficulty')}
            >
              <PieChartIcon className="w-3 h-3 mr-1" />
              DIFFICULTY
            </Badge>
            <Badge 
              className={`cursor-pointer font-space text-xs transition-all ${
                activeChart === 'activity' 
                ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50' 
                : 'bg-card text-muted-foreground border-primary/30 hover:border-neon-cyan/50'
              }`}
              onClick={() => setActiveChart('activity')}
            >
              <Calendar className="w-3 h-3 mr-1" />
              ACTIVITY
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-64">
          {activeChart === 'progress' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="solvedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748B', fontFamily: 'Space Mono' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748B', fontFamily: 'Space Mono' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="solved"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fill="url(#solvedGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'difficulty' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-card/90 backdrop-blur-sm border border-primary/30 p-3 rounded-lg shadow-lg">
                          <p className="font-space text-primary font-semibold">{data.name}</p>
                          <p className="font-mono text-sm" style={{ color: data.color }}>
                            Solved: {data.value}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'activity' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyActivity}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748B', fontFamily: 'Space Mono' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748B', fontFamily: 'Space Mono' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="submissions" fill="#06B6D4" name="Submissions" />
                <Bar dataKey="accepted" fill="#10B981" name="Accepted" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart Stats */}
        <div className="mt-4 pt-4 border-t border-primary/20">
          <div className="grid grid-cols-3 gap-4 text-center">
            {activeChart === 'progress' && (
              <>
                <div>
                  <div className="text-lg font-space font-bold text-neon-purple">187</div>
                  <div className="text-xs font-space text-muted-foreground">TOTAL SOLVED</div>
                </div>
                <div>
                  <div className="text-lg font-space font-bold text-neon-green">+32</div>
                  <div className="text-xs font-space text-muted-foreground">THIS MONTH</div>
                </div>
                <div>
                  <div className="text-lg font-space font-bold text-neon-cyan">23.4</div>
                  <div className="text-xs font-space text-muted-foreground">AVG/MONTH</div>
                </div>
              </>
            )}
            
            {activeChart === 'difficulty' && (
              <>
                <div>
                  <div className="text-lg font-space font-bold text-green-400">89</div>
                  <div className="text-xs font-space text-muted-foreground">EASY (48%)</div>
                </div>
                <div>
                  <div className="text-lg font-space font-bold text-yellow-400">73</div>
                  <div className="text-xs font-space text-muted-foreground">MEDIUM (39%)</div>
                </div>
                <div>
                  <div className="text-lg font-space font-bold text-red-400">25</div>
                  <div className="text-xs font-space text-muted-foreground">HARD (13%)</div>
                </div>
              </>
            )}
            
            {activeChart === 'activity' && (
              <>
                <div>
                  <div className="text-lg font-space font-bold text-neon-cyan">524</div>
                  <div className="text-xs font-space text-muted-foreground">SUBMISSIONS</div>
                </div>
                <div>
                  <div className="text-lg font-space font-bold text-neon-green">342</div>
                  <div className="text-xs font-space text-muted-foreground">ACCEPTED</div>
                </div>
                <div>
                  <div className="text-lg font-space font-bold text-neon-purple">65.3%</div>
                  <div className="text-xs font-space text-muted-foreground">SUCCESS RATE</div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}