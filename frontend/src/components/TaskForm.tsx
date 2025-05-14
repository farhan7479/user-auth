import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { AppDispatch } from '../store';
import { createTask } from '../store/slices/taskSlice';

interface TaskFormProps {
  setShowAddTask: React.Dispatch<React.SetStateAction<boolean>>;
}

// Define the status type to match the expected values
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

const TaskForm: React.FC<TaskFormProps> = ({ setShowAddTask }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO' as TaskStatus,
  });
  
  const { title, description, status } = formData;
  const dispatch = useDispatch<AppDispatch>();
  
  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };
  
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!title) {
      toast.error('Please add a title');
      return;
    }
    
    dispatch(createTask({
      title,
      description,
      status: status as TaskStatus
    }))
      .unwrap()
      .then(() => {
        toast.success('Task created successfully');
        setFormData({
          title: '',
          description: '',
          status: 'TODO' as TaskStatus,
        });
        setShowAddTask(false);
      })
      .catch((error) => {
        toast.error(error);
      });
  };
  
  return (
    <div className="bg-gray-100 p-4 rounded-md mb-6">
      <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label
            htmlFor="title"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={title}
            onChange={onChange}
            className="input"
            placeholder="Task title"
            required
          />
        </div>
        
        <div className="mb-4">
          <label
            htmlFor="description"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={onChange}
            className="input h-24"
            placeholder="Task description"
          />
        </div>
        
        <div className="mb-4">
          <label
            htmlFor="status"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={onChange}
            className="input"
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => setShowAddTask(false)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Add Task
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
