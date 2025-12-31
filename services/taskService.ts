import { db } from './firebase';
import {
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  query,
  where,
  collection,
} from 'firebase/firestore';
import { Task, TaskList } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class TaskService {
  static async createTask(userId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    try {
      const newTask: Task = {
        ...task,
        id: uuidv4(), // Client-side ID generation for optimistic UI if needed
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId,
      };

      const tasksRef = collection(db, 'tasks');
      // Note: addDoc generates a NEW Document ID. 
      // We are storing our 'newTask' object which includes an 'id' field (UUID).
      // The document ID will be different from newTask.id.
      // Ideally we should use setDoc with newTask.id if we want them to match, 
      // but following the requested pattern:
      const docRef = await addDoc(tasksRef, {
        ...newTask,
        userId,
      });

      // Return the task with the Firestore Document ID as 'id' to ensure consistency with getTasks
      return { ...newTask, id: docRef.id };
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  static async getTasksByUser(userId: string): Promise<Task[]> {
    try {
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      // Map Firestore ID to the Task 'id' field
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  static async getTasksByList(listId: string): Promise<Task[]> {
    try {
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, where('listId', '==', listId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  static async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  static async deleteTask(taskId: string): Promise<void> {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  static async createList(userId: string, list: Omit<TaskList, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskList> {
    try {
      const newList: TaskList = {
        ...list,
        id: uuidv4(),
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const listsRef = collection(db, 'task_lists');
      const docRef = await addDoc(listsRef, newList);
      return { ...newList, id: docRef.id };
    } catch (error) {
      console.error('Error creating list:', error);
      throw error;
    }
  }

  static async getListsByUser(userId: string): Promise<TaskList[]> {
    try {
      const listsRef = collection(db, 'task_lists');
      const q = query(listsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TaskList));
    } catch (error) {
      console.error('Error fetching lists:', error);
      throw error;
    }
  }
}