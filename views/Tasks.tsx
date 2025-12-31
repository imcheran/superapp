import React, { useState } from 'react';
import { Task, Subtask } from '../types';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Flag, Tag, ChevronDown, ChevronUp } from 'lucide-react';

interface TasksProps {
  tasks: Task[];
  onUpdateTasks: (tasks: Task[]) => void;
}

const Tasks: React.FC<TasksProps> = ({ tasks, onUpdateTasks }) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Basic Task Actions
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      priority: 'NONE',
      tags: [],
      subtasks: [],
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      listId: 'inbox',
      userId: 'current_user',
      createdBy: 'self',
      reminders: []
    };
    
    onUpdateTasks([newTask, ...tasks]);
    setNewTaskTitle('');
  };

  const toggleTask = (id: string) => {
    onUpdateTasks(tasks.map(t => 
      t.id === id ? { ...t, isCompleted: !t.isCompleted, completedAt: !t.isCompleted ? new Date().toISOString() : undefined } : t
    ));
  };

  const deleteTask = (id: string) => {
    onUpdateTasks(tasks.filter(t => t.id !== id));
  };

  const updatePriority = (id: string, priority: Task['priority']) => {
    onUpdateTasks(tasks.map(t => t.id === id ? { ...t, priority } : t));
  };

  // Filtering
  const filteredTasks = tasks.filter(t => {
    if (filter === 'ACTIVE') return !t.isCompleted;
    if (filter === 'COMPLETED') return t.isCompleted;
    return true;
  });

  const getPriorityColor = (p: Task['priority']) => {
    switch (p) {
      case 'HIGH': return 'text-rose-500 bg-rose-50 border-rose-200';
      case 'MEDIUM': return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'LOW': return 'text-indigo-500 bg-indigo-50 border-indigo-200';
      default: return 'text-slate-400 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in font-sans pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-black text-slate-800">My Tasks</h2>
           <p className="text-slate-500 text-sm">Manage your daily todos and projects.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl self-start">
          {['ALL', 'ACTIVE', 'COMPLETED'].map((f) => (
             <button
               key={f}
               onClick={() => setFilter(f as any)}
               className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
             >
               {f}
             </button>
          ))}
        </div>
      </div>

      {/* Add Task Input */}
      <form onSubmit={addTask} className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
           <Plus size={24} />
        </div>
        <input 
          type="text" 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add a new task..."
          className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-lg placeholder:text-slate-400 transition-shadow"
        />
        <button 
           type="submit"
           className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors opacity-0 group-focus-within:opacity-100"
        >
           Add
        </button>
      </form>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 border-dashed">
              <p className="text-slate-400 font-medium">No tasks found. Time to relax or get productive!</p>
           </div>
        ) : (
           filteredTasks.map(task => (
             <div key={task.id} className="group bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-start gap-3">
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-indigo-500 text-transparent'}`}
                >
                   <CheckCircle2 size={16} fill="currentColor" className={task.isCompleted ? 'block' : 'hidden'} />
                </button>
                
                <div className="flex-1 min-w-0">
                   <p className={`text-base font-medium transition-all ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {task.title}
                   </p>
                   
                   <div className="flex flex-wrap items-center gap-2 mt-2">
                      <div className="relative group/prio">
                         <button className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)} flex items-center gap-1`}>
                            <Flag size={10} /> {task.priority === 'NONE' ? 'Priority' : task.priority}
                         </button>
                         <div className="absolute top-full left-0 mt-1 bg-white border border-slate-100 shadow-lg rounded-lg p-1 hidden group-hover/prio:flex flex-col z-10 min-w-[100px]">
                            {['HIGH', 'MEDIUM', 'LOW', 'NONE'].map((p) => (
                               <button 
                                 key={p} 
                                 onClick={() => updatePriority(task.id, p as any)}
                                 className="text-left px-2 py-1 text-xs hover:bg-slate-50 rounded text-slate-700 font-bold"
                               >
                                 {p}
                               </button>
                            ))}
                         </div>
                      </div>
                      
                      {task.dueDate && (
                         <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                            <Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString()}
                         </span>
                      )}
                   </div>
                </div>

                <button 
                  onClick={() => deleteTask(task.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
             </div>
           ))
        )}
      </div>
    </div>
  );
};

export default Tasks;