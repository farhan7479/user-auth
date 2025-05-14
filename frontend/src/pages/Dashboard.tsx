import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AppDispatch, RootState } from '../store';
import { getTasks, resetTaskState } from '../store/slices/taskSlice';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import Header from '../components/Header';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const [showAddTask, setShowAddTask] = useState(false);
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { tasks, isLoading, isError, message } = useSelector(
    (state: RootState) => state.tasks
  );
  
  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Fetch tasks
    dispatch(getTasks());
    
    // Cleanup on component unmount
    return () => {
      dispatch(resetTaskState());
    };
  }, [user, navigate, dispatch]);
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
  }, [isError, message]);
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Welcome, {user?.name || user?.email}
            </h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddTask(!showAddTask)}
            >
              {showAddTask ? 'Close' : 'Add Task'}
            </button>
          </div>
          
          {showAddTask && <TaskForm setShowAddTask={setShowAddTask} />}
          
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Your Tasks</h3>
            
            {isLoading ? (
              <p>Loading tasks...</p>
            ) : tasks.length > 0 ? (
              <TaskList tasks={tasks} />
            ) : (
              <p className="text-gray-500">You have no tasks yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
