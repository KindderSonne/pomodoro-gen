
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Task } from '@/types';
import { Plus, Trash, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

interface TaskListProps {
  onTaskSelect: (taskId: string | null) => void;
  selectedTaskId: string | null;
}

const TaskList: React.FC<TaskListProps> = ({ onTaskSelect, selectedTaskId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      return;
    }

    const tasksRef = collection(db, 'users', currentUser.uid, 'tasks');
    const tasksQuery = query(
      tasksRef,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const taskList: Task[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        taskList.push({
          id: doc.id,
          title: data.title,
          completed: data.completed,
          createdAt: data.createdAt?.toMillis() || Date.now(),
        });
      });
      setTasks(taskList);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [currentUser]);

  const addTask = async () => {
    if (!currentUser || !newTaskTitle.trim()) return;

    try {
      const tasksRef = collection(db, 'users', currentUser.uid, 'tasks');
      await addDoc(tasksRef, {
        title: newTaskTitle,
        completed: false,
        createdAt: new Date(),
      });
      setNewTaskTitle('');
    } catch (error) {
      console.error("Error adding task:", error);
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    }
  };

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    if (!currentUser) return;

    try {
      const taskRef = doc(db, 'users', currentUser.uid, 'tasks', taskId);
      await updateDoc(taskRef, {
        completed: !completed,
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!currentUser) return;

    try {
      const taskRef = doc(db, 'users', currentUser.uid, 'tasks', taskId);
      await deleteDoc(taskRef);
      
      // If the deleted task was selected, clear the selection
      if (selectedTaskId === taskId) {
        onTaskSelect(null);
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleTaskSelect = (taskId: string) => {
    if (selectedTaskId === taskId) {
      onTaskSelect(null); // Deselect if already selected
    } else {
      onTaskSelect(taskId); // Select the task
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Tasks</span>
          <span className="text-sm text-muted-foreground">
            {tasks.filter(t => t.completed).length}/{tasks.length} completed
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTask();
            }}
            className="flex-1"
            disabled={!currentUser}
          />
          <Button 
            onClick={addTask} 
            disabled={!newTaskTitle.trim() || !currentUser}
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {currentUser ? (
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tasks yet. Add your first task above!
              </div>
            ) : (
              tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`flex items-center justify-between p-3 border rounded-md ${
                    selectedTaskId === task.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center flex-1">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.completed}
                      onCheckedChange={() => toggleTaskCompletion(task.id, task.completed)}
                      className="mr-2"
                    />
                    <Label
                      htmlFor={`task-${task.id}`}
                      className={`flex-1 cursor-pointer ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                      onClick={() => handleTaskSelect(task.id)}
                    >
                      {task.title}
                    </Label>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleTaskSelect(task.id)}
                    >
                      <Check className={`h-4 w-4 ${selectedTaskId === task.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Sign in to manage your tasks
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskList;
