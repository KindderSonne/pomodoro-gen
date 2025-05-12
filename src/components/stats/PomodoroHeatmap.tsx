import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays, parseISO, isValid, addDays, startOfWeek, startOfMonth, getMonth, getDate, getDay } from 'date-fns';

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
        // Get sessions from the last 365 days
        const startDate = subDays(new Date(), 365);
        
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
        for (let i = 0; i <= 365; i++) {
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
    for (let i = 0; i <= 365; i++) {
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
    if (count === 0) return 0;      // Mức 0: Không có Pomodoro
    if (count <= 3) return 1;       // Mức 1: 1-3 Pomodoro
    if (count <= 6) return 2;       // Mức 2: 4-6 Pomodoro
    if (count <= 9) return 3;       // Mức 3: 7-9 Pomodoro
    return 4;                       // Mức 4: >=10 Pomodoro
  };

  // Tạo mảng các tuần trong năm, mỗi tuần là một mảng 7 ngày (bắt đầu từ Chủ nhật)
  const getWeeksOfYear = () => {
    const today = new Date();
    const startDate = subDays(today, 365);
    const startSunday = startOfWeek(startDate, { weekStartsOn: 0 });
    const weeks = [];
    let current = startSunday;
    while (current <= today) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(format(current, 'yyyy-MM-dd'));
        current = addDays(current, 1);
      }
      weeks.push(week);
    }
    return weeks;
  };

  // Lấy nhãn tháng cho các cột đầu tiên của mỗi tháng
  const getMonthLabels = (weeks: string[][]) => {
    const labels: { index: number, label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const firstDay = parseISO(week[0]);
      const month = getMonth(firstDay);
      if (month !== lastMonth) {
        labels.push({ index: i, label: format(firstDay, 'MMM') });
        lastMonth = month;
      }
    });
    return labels;
  };

  const weeks = getWeeksOfYear();
  const monthLabels = getMonthLabels(weeks);

  const renderCells = () => {
    return weeks.map((week, weekIdx) =>
      week.map((date, dayIdx) => {
        const count = visualData[date] || 0;
        const parsedDate = parseISO(date);
        if (!isValid(parsedDate) || parseISO(date) > new Date()) return null;
        const intensityLevel = getIntensityLevel(count);
        return (
          <rect
            key={date}
            x={weekIdx * (cellSize + cellMargin)}
            y={dayIdx * (cellSize + cellMargin) + 20} // +20 để chừa chỗ cho nhãn tháng
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
      })
    );
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
                width={weeks.length * (cellSize + cellMargin)}
                height={7 * (cellSize + cellMargin) + 30}
                className="heatmap"
              >
                {/* Nhãn tháng */}
                {monthLabels.map(({ index, label }) => (
                  <text
                    key={label}
                    x={index * (cellSize + cellMargin)}
                    y={15}
                    fontSize={12}
                    fill="#bdbdbd"
                  >
                    {label}
                  </text>
                ))}
                {renderCells()}
              </svg>
            </div>
            <div className="flex items-center justify-center mt-2 select-none">
              <span className="text-muted-foreground mr-2" style={{fontSize:12}}>Less</span>
              <svg height={14} width={5*16} style={{verticalAlign:'middle'}}>
                {[0,1,2,3,4].map((level, idx) => (
                  <rect
                    key={level}
                    x={idx*16}
                    y={2}
                    width={12}
                    height={12}
                    rx={2}
                    className={`pomodoro-heatmap-cell-level-${level}`}
                  />
                ))}
              </svg>
              <span className="text-muted-foreground ml-2" style={{fontSize:12}}>More</span>
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
