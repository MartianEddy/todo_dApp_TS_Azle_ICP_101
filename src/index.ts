import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

// Define a Task type
type Task = Record<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

// Define a TaskPayload type for creating and updating tasks
type TaskPayload = Record<{
    title: string;
    description: string;
    completed: boolean;
}>

// Create a StableBTreeMap to store tasks
const taskStorage = new StableBTreeMap<string, Task>(0, 44, 1024);

// Function to retrieve all tasks
$query;
export function getTasks(): Result<Vec<Task>, string> {
    return Result.Ok(taskStorage.values());
}

// Function to retrieve a single task by ID
$query;
export function getTask(id: string): Result<Task, string> {
    return match(taskStorage.get(id), {
        Some: (task) => Result.Ok<Task, string>(task),
        None: () => Result.Err<Task, string>(`Task with ID ${id} not found`),
    });
}

// Function to add a new task
$update;
export function addTask(payload: TaskPayload): Result<Task, string> {
    const newTask: Task = {
        id: uuidv4(),
        createdAt: ic.time(),
        updatedAt: Opt.None,
        ...payload,
    };
    taskStorage.insert(newTask.id, newTask);
    return Result.Ok(newTask);
}

// Function to update an existing task by ID
$update;
export function updateTask(id: string, payload: TaskPayload): Result<Task, string> {
    return match(taskStorage.get(id), {
        Some: (task) => {
            const updatedTask: Task = {
                ...task,
                ...payload,
                updatedAt: Opt.Some(ic.time()),
            };
            taskStorage.insert(id, updatedTask);
            return Result.Ok(updatedTask);
        },
        None: () => Result.Err<Task, string>(`Task with ID ${id} not found`),
    });
}

// Function to mark a task as completed by ID
$update;
export function completeTask(id: string): Result<Task, string> {
    return match(taskStorage.get(id), {
        Some: (task) => {
            const completedTask: Task = {
                ...task,
                completed: true,
                updatedAt: Opt.Some(ic.time()),
            };
            taskStorage.insert(id, completedTask);
            return Result.Ok(completedTask);
        },
        None: () => Result.Err<Task, string>(`Task with ID ${id} not found`),
    });
}

// Function to delete a task by ID
$update;
export function deleteTask(id: string): Result<Task, string> {
    return match(taskStorage.remove(id), {
        Some: (deletedTask) => Result.Ok(deletedTask),
        None: () => Result.Err<Task, string>(`Task with ID ${id} not found`),
    });
}

// Function to list completed tasks
$query;
export function listCompletedTasks(): Result<Vec<Task>, string> {
    const completedTasks = taskStorage.values().filter((task) => task.completed);
    return Result.Ok(completedTasks);
}

// Function to list incompleted tasks
$query;
export function listIncompleteTasks(): Result<Vec<Task>, string> {
    const incompleteTasks = taskStorage.values().filter((task) => !task.completed);
    return Result.Ok(incompleteTasks);
}

// Function to count total tasks
$query;
export function countTotalTasks(): Result<number, string> {
    const totalTasks = taskStorage.size();
    return Result.Ok(totalTasks);
}

// Function to archive completed tasks
$update;
export function archiveCompletedTasks(): Result<Vec<Task>, string> {
    const completedTasks = taskStorage.values().filter((task) => task.completed);
    completedTasks.forEach((task) => taskStorage.remove(task.id));
    return Result.Ok(completedTasks);
}

// Function to clear all tasks
$update;
export function clearAllTasks(): Result<string, string> {
    taskStorage.clear();
    return Result.Ok("All tasks cleared");
}

