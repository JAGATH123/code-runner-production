'use client';

import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useGlobalAudio } from '@/contexts/AudioContext';
import { useProgress } from '@/lib/utilities/progress';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Settings,
  Volume2,
  VolumeX,
  Music,
  Trash2,
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const router = useRouter();
  const {
    isBackgroundMusicEnabled,
    isSoundEffectsEnabled,
    toggleBackgroundMusic,
    toggleSoundEffects
  } = useGlobalAudio();

  const progress = useProgress();
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleResetProgress = () => {
    progress.resetProgress();
    setShowResetDialog(false);
    router.push('/home');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary" />
              Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your preferences and account settings
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Audio Settings */}
          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-primary" />
                Audio Settings
              </CardTitle>
              <CardDescription>
                Control background music and sound effects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Background Music */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="background-music" className="text-base flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Background Music
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Play ambient music while using the app
                  </p>
                </div>
                <Switch
                  id="background-music"
                  checked={isBackgroundMusicEnabled}
                  onCheckedChange={toggleBackgroundMusic}
                />
              </div>

              <Separator />

              {/* Sound Effects */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound-effects" className="text-base flex items-center gap-2">
                    {isSoundEffectsEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                    Sound Effects
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Play sounds for button clicks and interactions
                  </p>
                </div>
                <Switch
                  id="sound-effects"
                  checked={isSoundEffectsEnabled}
                  onCheckedChange={toggleSoundEffects}
                />
              </div>
            </CardContent>
          </Card>

          {/* Progress Settings */}
          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Progress Management
              </CardTitle>
              <CardDescription>
                Manage your learning progress and data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <AlertTriangle className="w-4 h-4" />
                    Danger Zone
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Resetting your progress will clear all completed problems and levels. This action cannot be undone.
                  </p>

                  <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="gap-2">
                        <Trash2 className="w-4 h-4" />
                        Reset All Progress
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all your progress including:
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>All completed problems</li>
                            <li>All completed levels</li>
                            <li>Current level progress</li>
                          </ul>
                          <p className="mt-3 font-semibold text-destructive">
                            This action cannot be undone!
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleResetProgress}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Yes, Reset Everything
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Info (Placeholder for future) */}
          <Card className="border-primary/20 bg-card/50 backdrop-blur opacity-50">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Coming soon - Manage your account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Email, password, and account management features will be available soon.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
