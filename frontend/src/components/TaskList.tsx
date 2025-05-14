import TaskItem from './TaskItem';
import { Task } from '../store/slices/taskSlice';

interface TaskListProps {
  tasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  // Group tasks by status
  const todoTasks = tasks.filter((task) => task.status === 'TODO');
  const inProgressTasks = tasks.filter((task) => task.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter((task) => task.status === 'DONE');
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <h4 className="font-semibold mb-3 text-yellow-700 border-b pb-2">
          To Do ({todoTasks.length})
        </h4>
        {todoTasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
        {todoTasks.length === 0 && (
          <p className="text-gray-500 text-sm italic">No tasks to do</p>
        )}
      </div>
      
      <div>
        <h4 className="font-semibold mb-3 text-blue-700 border-b pb-2">
          In Progress ({inProgressTasks.length})
        </h4>
        {inProgressTasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
        {inProgressTasks.length === 0 && (
          <p className="text-gray-500 text-sm italic">No tasks in progress</p>
        )}
      </div>
      
      <div>
        <h4 className="font-semibold mb-3 text-green-700 border-b pb-2">
          Done ({doneTasks.length})
        </h4>
        {doneTasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
        {doneTasks.length === 0 && (
          <p className="text-gray-500 text-sm italic">No completed tasks</p>
        )}
      </div>
    </div>
  );
};

export default TaskList;
