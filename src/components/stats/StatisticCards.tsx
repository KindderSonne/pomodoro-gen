import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCheck, Trophy, Play } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface StatisticProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
}

const StatisticCard: React.FC<StatisticProps> = ({ title, value, icon, subtitle }) => (
  <Card className="w-full">
    <CardContent className="p-4 md:p-6 w-full">
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground break-words">{title}</p>
          <p className="text-2xl font-bold mt-1 break-words">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1 break-words">{subtitle}</p>
          )}
        </div>
        <div className="max-w-[56px] max-h-[56px] h-12 w-12 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto sm:mx-0 overflow-hidden shrink-0">
          <span className="w-8 h-8 flex items-center justify-center overflow-hidden">
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { className: (icon.props.className || '') + ' max-w-full max-h-full' }) : icon}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const StatisticCards: React.FC = () => {
  const { currentUser } = useAuth();
  const [totalPomodoros, setTotalPomodoros] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalFocusHours, setTotalFocusHours] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) {
        // Reset stats when user logs out
        setTotalPomodoros(0);
        setTasksCompleted(0);
        setCurrentStreak(0);
        setTotalFocusHours(0);
        return;
      }

      try {
        // Fetch total completed pomodoros
        const pomodorosRef = collection(db, 'users', currentUser.uid, 'sessions');
        const pomodorosQuery = query(
          pomodorosRef,
          where('phase', '==', 'work'),
          where('endTime', '!=', null)
        );
        const pomodorosSnapshot = await getDocs(pomodorosQuery);
        setTotalPomodoros(pomodorosSnapshot.size);

        // Calculate total focus hours (assuming each pomodoro is 25 minutes)
        const focusMinutes = pomodorosSnapshot.size * 25;
        setTotalFocusHours(parseFloat((focusMinutes / 60).toFixed(1)));

        // Fetch tasks completed
        const tasksRef = collection(db, 'users', currentUser.uid, 'tasks');
        const tasksQuery = query(
          tasksRef,
          where('completed', '==', true)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        setTasksCompleted(tasksSnapshot.size);

        // Calculate current streak
        const datesWithPomodoros = new Set<string>();
        pomodorosSnapshot.forEach(doc => {
          const session = doc.data();
          if (session.startTime) {
            const date = format(session.startTime.toDate(), 'yyyy-MM-dd');
            datesWithPomodoros.add(date);
          }
        });

        let streak = 0;
        const today = new Date();
        let currentDate = today;
        
        // Check backwards from today to find streak
        while (true) {
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          if (datesWithPomodoros.has(dateStr)) {
            streak++;
            currentDate = new Date(currentDate.setDate(currentDate.getDate() - 1));
          } else {
            // No pomodoro for this day, streak ends
            break;
          }
        }
        
        setCurrentStreak(streak);
      } catch (error) {
        console.error("Error fetching statistics:", error);
      }
    };

    fetchStats();
  }, [currentUser]);

  return (
    <div className="w-full max-w-full overflow-hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatisticCard
        title="Total Pomodoros"
        value={totalPomodoros.toString()}
        icon={<Clock className="h-8 w-8 text-primary" />}
      />
      <StatisticCard
        title="Tasks Completed"
        value={tasksCompleted.toString()}
        icon={<CheckCheck className="h-8 w-8 text-green-500" />}
      />
      <StatisticCard
        title="Current Streak"
        value={`${currentStreak} day${currentStreak === 1 ? '' : 's'}`}
        icon={<Trophy className="h-8 w-8 text-yellow-500" />}
      />
      <StatisticCard
        title="Focus Time"
        value={`${totalFocusHours} hrs`}
        icon={<Play className="h-8 w-8 text-primary" />}
        subtitle="Total focused work time"
      />
    </div>
  );
};

export default StatisticCards;
