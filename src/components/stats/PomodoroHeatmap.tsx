
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays, parseISO, isValid } from 'date-fns';

interface HeatmapData {
  [date: string]: number;
}

const PomodoroHeatmap: React.FC = () => {
  const { currentUser } = useAuth();
  const [heatmapData, setHeatmapData] = useState<HeatmapData>({});
  const [loading, setLoading] = useState(true);

  // Fetch and process data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        setHeatmapData({});
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get sessions from the last 90 days
        const startDate = subDays(new Date(), 90);
        
        const sessionsRef = collection(db, 'users', currentUser.uid, 'sessions');
        const sessionsQuery = query(
          sessionsRef,
          where('phase', '==', 'work'),
          where('endTime', '!=', null),
          where('startTime', '>=', startDate)
        );

        const sessionsSnapshot = await getDocs(sessionsQuery);
        
        const data: HeatmapData = {};
        
        // Initialize data object with all dates in the range
        for (let i = 0; i <= 90; i++) {
          const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
          data[date] = 0;
        }
        
        // Count sessions per day
        sessionsSnapshot.forEach((doc) => {
          const session = doc.data();
          if (session.startTime) {
            const date = format(session.startTime.toDate(), 'yyyy-MM-dd');
            if (data[date] !== undefined) {
              data[date]++;
            }
          }
        });
        
        setHeatmapData(data);
      } catch (error) {
        console.error("Error fetching heatmap data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Calculate SVG dimensions
  const cellSize = 12;
  const cellMargin = 4;
  const totalWidth = 53 * (cellSize + cellMargin); // 53 weeks in a year
  const totalHeight = 7 * (cellSize + cellMargin); // 7 days in a week
  
  // Generate fake data for visual testing (in case the user hasn't logged in yet)
  const generateFakeData = (): HeatmapData => {
    const data: HeatmapData = {};
    for (let i = 0; i <= 90; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      // Random number between 0 and 8, with higher probability for lower numbers
      const count = Math.floor(Math.random() * Math.random() * 8);
      data[date] = count;
    }
    return data;
  };

  const visualData = currentUser ? heatmapData : generateFakeData();
  
  // Get intensity level (0-4) based on the count value
  const getIntensityLevel = (count: number): number => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 8) return 3;
    return 4;
  };

  const renderCells = () => {
    const cells = [];
    const today = new Date();
    const sortedDates = Object.keys(visualData).sort((a, b) => {
      const dateA = parseISO(a);
      const dateB = parseISO(b);
      return dateA.getTime() - dateB.getTime();
    }).slice(-91); // Last 91 days

    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i];
      const count = visualData[date] || 0;
      const parsedDate = parseISO(date);
      
      if (!isValid(parsedDate)) continue;
      
      const dayOfWeek = parsedDate.getDay(); // 0 (Sunday) to 6 (Saturday)
      const weekOfYear = Math.floor(i / 7);
      
      const x = weekOfYear * (cellSize + cellMargin);
      const y = dayOfWeek * (cellSize + cellMargin);
      
      const intensityLevel = getIntensityLevel(count);
      
      cells.push(
        <rect
          key={date}
          x={x}
          y={y}
          width={cellSize}
          height={cellSize}
          rx={2}
          className={`pomodoro-heatmap-cell-level-${intensityLevel}`}
          data-date={date}
          data-count={count}
        >
          <title>{`${format(parsedDate, 'MMM d, yyyy')}: ${count} pomodoros`}</title>
        </rect>
      );
    }
    
    return cells;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Pomodoro Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto pb-4">
              <svg
                width={totalWidth}
                height={totalHeight}
                className="heatmap"
              >
                {renderCells()}
              </svg>
            </div>
            <div className="flex items-center justify-end mt-2 text-sm">
              <span className="text-muted-foreground mr-1">Less</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <div 
                  key={level}
                  className={`w-3 h-3 mx-0.5 rounded-sm pomodoro-heatmap-cell-level-${level}`}
                />
              ))}
              <span className="text-muted-foreground ml-1">More</span>
            </div>
          </>
        )}
        
        {!currentUser && (
          <div className="text-center mt-4 text-sm text-muted-foreground">
            Sign in to track your Pomodoro activity
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PomodoroHeatmap;
