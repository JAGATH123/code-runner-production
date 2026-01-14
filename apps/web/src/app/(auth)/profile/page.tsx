'use client';

import { Header } from '@/components/layout/Header';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { Achievements } from '@/components/profile/Achievements';
import { SkillsTags } from '@/components/profile/SkillsTags';
import { ActivityCalendar } from '@/components/profile/ActivityCalendar';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useState } from 'react';
import { usePageAudio } from '@/hooks/usePageAudio';
import {
  User,
  Settings
} from 'lucide-react';

type MenuItem = 'profile' | 'settings';

export default function ProfilePage() {
  const { } = useGlobalAudio();
  const [activeTab, setActiveTab] = useState<MenuItem>('profile');

  // Use the new page audio hook for smooth transitions
  usePageAudio({ audioType: 'profile' });

  const menuItems = [
    { id: 'profile' as MenuItem, label: 'Profile', icon: User },
    { id: 'settings' as MenuItem, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 relative overflow-hidden">
      <Header />

      <main className="flex-grow w-full relative z-10 flex">
        <div className="flex flex-col md:flex-row w-full">
          {/* Left Sidebar Navigation */}
          <aside className="w-full md:w-72 min-h-auto md:min-h-screen bg-white/60 backdrop-blur-md border-b md:border-b-0 md:border-r border-gray-200/50 flex flex-col shadow-sm">
            {/* User Profile Section */}
            <div className="p-4 md:p-6 border-b border-gray-200/50">
              <div className="flex md:flex-col items-center md:items-center gap-4 md:gap-0">
                <div className="relative w-16 h-16 md:w-24 md:h-24 md:mb-4">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-blue-400 flex items-center justify-center shadow-md flex-shrink-0">
                    <User className="w-8 h-8 md:w-12 md:h-12 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 md:flex-none text-left md:text-center">
                  <h3 className="font-semibold text-lg md:text-xl text-gray-800">@CodeMaster9000</h3>
                  <p className="text-xs text-gray-500 mt-1">Software Developer</p>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-3 md:p-4">
              <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`
                        flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg text-xs md:text-sm transition-all duration-200 whitespace-nowrap
                        ${isActive
                          ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                      <span className="text-left">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Footer Stats */}
            <div className="hidden md:block p-4 border-t border-gray-200/50">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Rank</span>
                  <span className="font-semibold text-blue-600">Advanced</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="w-full h-full p-4 md:p-8">
              {activeTab === 'profile' && (
                <div className="h-full flex flex-col">
                  <div className="mb-4 md:mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Profile</h2>
                    <p className="text-sm md:text-base text-gray-600">Your stats, achievements, and skills</p>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 md:space-y-6">
                    {/* Profile Stats & Activity Calendar - Parallel */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                      {/* Profile Stats - Left */}
                      <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-sm">
                        <ProfileStats />
                      </div>

                      {/* Activity Calendar - Right */}
                      <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-sm">
                        <ActivityCalendar />
                      </div>
                    </div>

                    {/* Achievements */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-sm">
                      <Achievements />
                    </div>

                    {/* Skills Matrix */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-sm">
                      <SkillsTags />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="h-full flex flex-col">
                  <div className="mb-4 md:mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Settings</h2>
                    <p className="text-sm md:text-base text-gray-600">Configure your preferences</p>
                  </div>
                  <div className="flex-1 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/80 shadow-sm p-8">
                    <p className="text-gray-600">Settings panel coming soon...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
