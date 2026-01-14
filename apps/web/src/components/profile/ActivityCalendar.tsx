'use client';

import { Badge } from '@/components/ui/badge';
import { Calendar, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface SubmissionDay {
  date: string;
  count: number;
  problems: number[];
}

const mockSubmissionData: SubmissionDay[] = [
  { date: '2024-01-01', count: 0, problems: [] },
  { date: '2024-01-02', count: 1, problems: [1] },
  { date: '2024-01-03', count: 3, problems: [2, 3, 4] },
  { date: '2024-01-04', count: 0, problems: [] },
  { date: '2024-01-05', count: 2, problems: [5, 6] },
  { date: '2024-01-06', count: 1, problems: [7] },
  { date: '2024-01-07', count: 0, problems: [] },
  { date: '2024-01-08', count: 4, problems: [8, 9, 10, 11] },
  { date: '2024-01-09', count: 2, problems: [12, 13] },
  { date: '2024-01-10', count: 1, problems: [14] },
  { date: '2024-01-11', count: 0, problems: [] },
  { date: '2024-01-12', count: 3, problems: [15, 16, 17] },
  { date: '2024-01-13', count: 1, problems: [18] },
  { date: '2024-01-14', count: 2, problems: [19, 20] },
  { date: '2024-01-15', count: 5, problems: [21, 22, 23, 24, 25] },
];

export function ActivityCalendar() {
  const [mounted, setMounted] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-11
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToPreviousYear = () => {
    setCurrentYear(currentYear - 1);
  };

  const goToNextYear = () => {
    setCurrentYear(currentYear + 1);
  };

  const generateMonthData = (year: number, month: number) => {
    const data: SubmissionDay[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const existing = mockSubmissionData.find(item => item.date === dateStr);
      data.push(existing || {
        date: dateStr,
        count: Math.random() > 0.7 ? Math.floor(Math.random() * 6) : 0,
        problems: []
      });
    }

    return data;
  };

  const monthData = generateMonthData(currentYear, currentMonth);
  const totalSubmissions = monthData.reduce((sum, day) => sum + day.count, 0);
  const activeDays = monthData.filter(day => day.count > 0).length;
  const monthStreak = calculateMonthStreak(monthData);

  function calculateMonthStreak(data: SubmissionDay[]): number {
    let maxStreak = 0;
    let currentStreakCount = 0;

    for (const day of data) {
      if (day.count > 0) {
        currentStreakCount++;
        maxStreak = Math.max(maxStreak, currentStreakCount);
      } else {
        currentStreakCount = 0;
      }
    }

    return maxStreak;
  }

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-white border-gray-200';
    return 'bg-blue-500 border-blue-600';
  };

  const organizeMonthByWeeks = () => {
    const weeks: SubmissionDay[][] = [];
    let currentWeek: SubmissionDay[] = [];

    // Get the first day of the month and its day of week
    const firstDate = new Date(monthData[0].date);
    const firstDayOfWeek = firstDate.getDay();

    // Fill empty days at the start of the first week
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: '', count: 0, problems: [] });
    }

    // Add all days of the month
    monthData.forEach((day) => {
      currentWeek.push(day);

      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    // Fill empty days at the end of the last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: '', count: 0, problems: [] });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const weeks = organizeMonthByWeeks();

  return (
    <div className="w-full h-full relative">
      <div className="p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
        {/* Header with Month and Year Navigation */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            Activity
          </h3>

          {/* Month and Year Navigation */}
          <div className="flex items-center gap-3">
            {/* Month Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={goToPreviousMonth}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>

              <Badge className="bg-blue-50 text-blue-600 border border-blue-200 text-xs px-3 py-1 font-medium min-w-[100px] text-center">
                {monthNames[currentMonth]}
              </Badge>

              <button
                onClick={goToNextMonth}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
            </div>

            {/* Year Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={goToPreviousYear}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Previous year"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>

              <Badge className="bg-purple-50 text-purple-600 border border-purple-200 text-xs px-3 py-1 font-medium min-w-[60px] text-center">
                {currentYear}
              </Badge>

              <button
                onClick={goToNextYear}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Next year"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200">
            <div className="text-lg sm:text-xl font-bold text-green-600">{totalSubmissions}</div>
            <div className="text-[10px] sm:text-xs text-green-700 mt-0.5">Submissions</div>
          </div>
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
            <div className="text-lg sm:text-xl font-bold text-blue-600">{activeDays}</div>
            <div className="text-[10px] sm:text-xs text-blue-700 mt-0.5">Active Days</div>
          </div>
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200">
            <div className="text-lg sm:text-xl font-bold text-purple-600">{monthStreak}</div>
            <div className="text-[10px] sm:text-xs text-purple-700 mt-0.5">Best Streak</div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-3">
          {/* Calendar as Calendar Month View */}
          <div className="w-full">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1.5">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="space-y-1 sm:space-y-1.5">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {week.map((day, dayIndex) => {
                    const dayNumber = day.date ? new Date(day.date).getDate() : '';
                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`aspect-square rounded border flex flex-col items-center justify-center ${
                          day.date
                            ? getIntensityClass(day.count)
                            : 'invisible'
                        }`}
                      >
                        {day.date && (
                          <span className={`text-xs sm:text-sm font-medium ${
                            day.count > 0 ? 'text-white' : 'text-gray-700'
                          }`}>{dayNumber}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
