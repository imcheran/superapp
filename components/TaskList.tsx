
import React from 'react';
import { Task } from '../types';
import { CheckCircle2, Circle, Calendar, Flag, Tag } from 'lucide-react';

interface TaskListProps {
    tasks: Task[];
    onToggle: (taskId: string) => void;
    onDelete: (taskId: string) => void;
    onEdit: (task: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onToggle, onDelete, onEdit }) => {
    const getPriorityColor = (p: string) => {
        switch(p) {
            case 'HIGH': return 'text-rose-500 bg-rose-50';
            case 'MEDIUM': return 'text-amber-500 bg-amber-50';
            case 'LOW': return 'text-indigo-500 bg-indigo-50';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="space-y-2">
            {tasks.map(task => (
                <div key={task.id} className="group flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all">
                    <button 
                        onClick={() => onToggle(task.id)}
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-indigo-500 text-transparent'}`}
                    >
                        <CheckCircle2 size={14} fill="currentColor" className={task.isCompleted ? 'block' : 'hidden'} />
                    </button>
                    
                    <div className="flex-1 cursor-pointer" onClick={() => onEdit(task)}>
                        <h4 className={`text-sm font-medium ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {task.title}
                        </h4>
                        
                        {(task.description || task.dueDate || task.tags.length > 0 || task.priority !== 'NONE') && (
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                {task.priority !== 'NONE' && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                                        <Flag size={10} /> {task.priority}
                                    </span>
                                )}
                                {task.dueDate && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${new Date(task.dueDate) < new Date() && !task.isCompleted ? 'text-rose-600 bg-rose-50' : 'text-slate-500 bg-slate-100'}`}>
                                        <Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                )}
                                {task.tags.map(tag => (
                                    <span key={tag} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <Tag size={10} /> {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {tasks.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">No tasks in this list.</div>
            )}
        </div>
    );
};

export default TaskList;
