import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PomodoroPhase } from '@/types';
import { Play, Pause, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';

interface PomodoroTimerProps {
  onSessionCompleted: (phase: PomodoroPhase) => void;
  activeTaskId?: string | null;
}

const POMODORO_SETTINGS = {
  work: 25 * 60, // 25 minutes in seconds
  break: 5 * 60, // 5 minutes in seconds
  longbreak: 15 * 60, // 15 minutes in seconds
};

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onSessionCompleted, activeTaskId }) => {
  const [phase, setPhase] = useState<PomodoroPhase>('work');
  const [timeLeft, setTimeLeft] = useState(POMODORO_SETTINGS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const { currentUser } = useAuth();
  const { toast } = useToast();

  // For testing purposes, using shorter times
  // In production, you'd use the POMODORO_SETTINGS constants
  const TEST_MODE = false;
  const testSettings = {
    work: 10, // 10 seconds
    break: 5, // 5 seconds
    longbreak: 8, // 8 seconds
  };

  const settings = TEST_MODE ? testSettings : POMODORO_SETTINGS;

  // Reset timer when phase changes
  useEffect(() => {
    setTimeLeft(settings[phase]);
  }, [phase, settings]);

  // Timer countdown logic
  useEffect(() => {
    let intervalId: number;

    if (isRunning && timeLeft > 0) {
      intervalId = window.setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Timer completed
      handleTimerComplete();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, timeLeft]);

  // Start a new Pomodoro session in Firestore
  const startNewSession = useCallback(async () => {
    if (!currentUser) return null;

    try {
      const sessionsRef = collection(db, 'users', currentUser.uid, 'sessions');
      const newSessionRef = await addDoc(sessionsRef, {
        startTime: serverTimestamp(),
        endTime: null,
        phase,
        taskId: activeTaskId || null,
      });
      
      return newSessionRef.id;
    } catch (error) {
      console.error("Error starting new session:", error);
      return null;
    }
  }, [currentUser, phase, activeTaskId]);

  // End the current session in Firestore
  const endCurrentSession = useCallback(async () => {
    if (!currentUser || !currentSessionId) return;

    try {
      const sessionRef = doc(db, 'users', currentUser.uid, 'sessions', currentSessionId);
      await updateDoc(sessionRef, {
        endTime: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error ending session:", error);
    }
  }, [currentUser, currentSessionId]);

  // Handle timer complete
  const handleTimerComplete = async () => {
    setIsRunning(false);

    // Play sound notification
    const audio = new Audio('/notification.mp3');
    audio.play().catch(e => console.log('Audio play failed:', e));

    // End the current session in Firestore
    await endCurrentSession();
    
    // Show toast notification
    toast({
      title: `${phase.charAt(0).toUpperCase() + phase.slice(1)} completed!`,
      description: phase === 'work' 
        ? "Great job! Take a break now." 
        : "Break is over. Ready to focus again?",
      duration: 5000,
    });

    // Notify parent component that session was completed
    onSessionCompleted(phase);

    // Update completed pomodoros count if work phase is completed
    if (phase === 'work') {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      
      // Determine next phase based on completed pomodoros
      const nextPhase: PomodoroPhase = newCount % 4 === 0 ? 'longbreak' : 'break';
      setPhase(nextPhase);
    } else {
      // After break or long break, go back to work phase
      setPhase('work');
    }
  };

  // Toggle timer start/pause
  const toggleTimer = async () => {
    if (!isRunning) {
      // Starting the timer
      if (timeLeft === settings[phase]) {
        // If timer is at the beginning, create a new session
        const sessionId = await startNewSession();
        if (sessionId) {
          setCurrentSessionId(sessionId);
        }
      }
    } else {
      // Pausing the timer
      // We keep the session open when pausing
    }
    
    setIsRunning(!isRunning);
  };

  // Skip to next phase
  const skipPhase = async () => {
    setIsRunning(false);
    
    // End the current session if it exists
    if (currentSessionId) {
      await endCurrentSession();
      setCurrentSessionId(null);
    }
    
    if (phase === 'work') {
      const nextPhase: PomodoroPhase = completedPomodoros % 4 === 3 ? 'longbreak' : 'break';
      setPhase(nextPhase);
    } else {
      setPhase('work');
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate the progress for the circular timer
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / settings[phase];
  const strokeDashoffset = circumference * (1 - progress);

  // Get the appropriate color for the current phase
  const getPhaseColor = (): string => {
    switch (phase) {
      case 'work':
        return 'text-pomodoro-work stroke-pomodoro-work';
      case 'break':
        return 'text-pomodoro-break stroke-pomodoro-break';
      case 'longbreak':
        return 'text-pomodoro-longbreak stroke-pomodoro-longbreak';
      default:
        return 'text-primary stroke-primary';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-center mb-4">
          <div className="flex gap-2">
            <Button 
              variant={phase === 'work' ? 'default' : 'outline'}
              onClick={() => { setIsRunning(false); setPhase('work'); }}
              className={phase === 'work' ? 'bg-pomodoro-work hover:bg-pomodoro-work/90' : ''}
            >
              Work
            </Button>
            <Button 
              variant={phase === 'break' ? 'default' : 'outline'}
              onClick={() => { setIsRunning(false); setPhase('break'); }}
              className={phase === 'break' ? 'bg-pomodoro-break hover:bg-pomodoro-break/90' : ''}
            >
              Short Break
            </Button>
            <Button 
              variant={phase === 'longbreak' ? 'default' : 'outline'}
              onClick={() => { setIsRunning(false); setPhase('longbreak'); }}
              className={phase === 'longbreak' ? 'bg-pomodoro-longbreak hover:bg-pomodoro-longbreak/90' : ''}
            >
              Long Break
            </Button>
          </div>
        </div>

        <div className="relative w-72 h-72 mx-auto my-8">
          <svg 
            className="absolute inset-0 w-full h-full transform -rotate-90"
            viewBox="0 0 200 200"
          >
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted opacity-20"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={cn('circle-progress', getPhaseColor())}
            />
          </svg>
          <div className={cn("absolute inset-0 flex flex-col items-center justify-center", getPhaseColor())}>
            <span className="text-6xl font-bold">{formatTime(timeLeft)}</span>
            <span className="text-lg font-medium mt-2 capitalize">
              {phase === 'longbreak' ? 'Long Break' : phase}
            </span>
            <span className="text-sm mt-1 opacity-70">
              {completedPomodoros} pomodoros completed
            </span>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <Button 
            onClick={toggleTimer} 
            size="lg" 
            className={cn(
              "w-32",
              phase === 'work' ? 'bg-pomodoro-work hover:bg-pomodoro-work/90' :
              phase === 'break' ? 'bg-pomodoro-break hover:bg-pomodoro-break/90' :
              'bg-pomodoro-longbreak hover:bg-pomodoro-longbreak/90'
            )}
          >
            {isRunning ? (
              <><Pause className="mr-1" size={18} /> Pause</>
            ) : (
              <><Play className="mr-1" size={18} /> Start</>
            )}
          </Button>
          <Button 
            onClick={skipPhase} 
            size="lg" 
            variant="outline"
            className="w-32"
          >
            <SkipForward size={18} className="mr-1" /> Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PomodoroTimer;
