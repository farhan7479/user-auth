import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { AppDispatch } from '../store';
import { Task, deleteTask, updateTask } from '../store/slices/taskSlice';

interface TaskItemProps {
  task: Task;
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
  });
  
  const dispatch = useDispatch<AppDispatch>();
  
  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setEditData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };
  
  const handleUpdate = () => {
    if (!editData.title) {
      toast.error('Title is required');
      return;
    }
    
    dispatch(
      updateTask({
        id: task.id,
        ...editData,
      })
    )
      .unwrap()
      .then(() => {
        toast.success('Task updated successfully');
        setIsEditing(false);
      })
      .catch((error) => {
        toast.error(error);
      });
  };
  
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch(deleteTask(task.id))
        .unwrap()
        .then(() => {
          toast.success('Task deleted successfully');
        })
        .catch((error) => {
          toast.error(error);
        });
    }
  };
  
  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'DONE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4 border border-gray-200">
      {isEditing ? (
        // Edit mode
        <div>
          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={editData.title}
              onChange={onChange}
              className="input"
              placeholder="Task title"
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={editData.description}
              onChange={onChange}
              className="input h-20"
              placeholder="Task description"
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1">
              Status
            </label>
            <select
              name="status"
              value={editData.status}
              onChange={onChange}
              className="input"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditData({
                  title: task.title,
                  description: task.description || '',
                  status: task.status,
                });
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              className="btn btn-primary"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        // View mode
        <div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {task.title}
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Created on {formatDate(task.createdAt)}
              </p>
            </div>
            
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                task.status
              )}`}
            >
              {task.status.replace('_', ' ')}
            </span>
          </div>
          
          <p className="text-gray-700 mb-4">
            {task.description || <em className="text-gray-400">No description</em>}
          </p>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-secondary text-sm py-1 px-3"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-danger text-sm py-1 px-3"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
