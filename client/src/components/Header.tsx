import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm z-10 relative">
      <div className="flex justify-between items-center px-4 py-3 lg:px-6">
        <div className="flex items-center lg:hidden">
          <button 
            type="button" 
            className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
            onClick={toggleSidebar}
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
          <div className="ml-3">
            <h1 className="text-lg font-bold font-heading text-primary dark:text-primary-light">Dietçim</h1>
          </div>
        </div>
        
        <div className="flex-1 mx-4 lg:mx-6 hidden lg:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-400"></i>
            </div>
            <input 
              type="text" 
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" 
              placeholder="Danışan ara..."
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          <button 
            type="button" 
            className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary relative"
          >
            <i className="fas fa-bell text-gray-500 dark:text-gray-400"></i>
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-xs text-white">3</span>
          </button>
          
          <div className="relative lg:hidden">
            <button 
              type="button" 
              className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {user?.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt="Kullanıcı profil resmi" 
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <i className="fas fa-user text-gray-500 dark:text-gray-400"></i>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
