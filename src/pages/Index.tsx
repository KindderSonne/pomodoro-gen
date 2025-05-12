
import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginButton from "@/components/auth/LoginButton";
import UserProfileButton from "@/components/auth/UserProfileButton";
import PomodoroTimer from "@/components/pomodoro/PomodoroTimer";
import TaskList from "@/components/tasks/TaskList";
import PomodoroHeatmap from "@/components/stats/PomodoroHeatmap";
import StatisticCards from "@/components/stats/StatisticCards";
import SpotifyPlayer from "@/components/spotify/SpotifyPlayer";
import { PomodoroPhase } from "@/types";

// Main app wrapped with AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <PomodoroApp />
    </AuthProvider>
  );
};

const PomodoroApp = () => {
  const { currentUser, loading } = useAuth();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState<boolean>(false);

  const handleSessionCompleted = (phase: PomodoroPhase) => {
    // When a work session is completed, refresh stats
    if (phase === 'work') {
      setShowStats(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex justify-between items-center h-16 px-4">
          <h1 className="text-2xl font-bold">Pomodoro Focus</h1>
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="animate-pulse w-24 h-8 bg-muted rounded"></div>
            ) : currentUser ? (
              <UserProfileButton />
            ) : (
              <LoginButton />
            )}
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Timer and Tasks column */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <PomodoroTimer 
              onSessionCompleted={handleSessionCompleted} 
              activeTaskId={selectedTaskId}
            />

            <TaskList 
              onTaskSelect={setSelectedTaskId}
              selectedTaskId={selectedTaskId}
            />
          </div>
          
          {/* Spotify and Stats column */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <SpotifyPlayer />
            
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Statistics</h2>
              <StatisticCards />
              <PomodoroHeatmap />
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Pomodoro Focus App | Made with ♥
        </div>
      </footer>
    </div>
  );
};

export default App;
