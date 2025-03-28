import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <aside className="flex flex-col h-full w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="bg-primary bg-opacity-20 dark:bg-opacity-20 rounded-lg p-2 mr-2">
            <i className="fas fa-leaf text-primary text-xl"></i>
          </div>
          <h1 className="text-xl font-bold font-heading text-primary dark:text-primary-light">Dietçim</h1>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Diyetisyen Müşteri Takip Uygulaması</p>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-2 px-3">Ana Menü</p>
        
        <Link href="/">
          <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
            isActive("/") 
              ? "bg-primary bg-opacity-10 dark:bg-opacity-20 text-primary dark:text-primary-light" 
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          } mb-1`}>
            <i className="fas fa-tachometer-alt w-5 h-5 mr-2"></i>
            <span>Gösterge Paneli</span>
          </a>
        </Link>
        
        <Link href="/clients">
          <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
            isActive("/clients") 
              ? "bg-primary bg-opacity-10 dark:bg-opacity-20 text-primary dark:text-primary-light" 
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          } mb-1`}>
            <i className="fas fa-users w-5 h-5 mr-2"></i>
            <span>Danışanlar</span>
          </a>
        </Link>
        
        <Link href="/diet-plans">
          <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
            isActive("/diet-plans") 
              ? "bg-primary bg-opacity-10 dark:bg-opacity-20 text-primary dark:text-primary-light" 
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          } mb-1`}>
            <i className="fas fa-utensils w-5 h-5 mr-2"></i>
            <span>Diyet Planları</span>
          </a>
        </Link>
        
        <Link href="/appointments">
          <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
            isActive("/appointments") 
              ? "bg-primary bg-opacity-10 dark:bg-opacity-20 text-primary dark:text-primary-light" 
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          } mb-1`}>
            <i className="fas fa-calendar-alt w-5 h-5 mr-2"></i>
            <span>Randevular</span>
          </a>
        </Link>
        
        <Link href="/measurements">
          <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
            isActive("/measurements") 
              ? "bg-primary bg-opacity-10 dark:bg-opacity-20 text-primary dark:text-primary-light" 
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          } mb-1`}>
            <i className="fas fa-weight w-5 h-5 mr-2"></i>
            <span>Ölçümler</span>
          </a>
        </Link>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-2 mt-6 px-3">Entegrasyonlar</p>
        
        <Link href="/telegram-bot">
          <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
            isActive("/telegram-bot") 
              ? "bg-primary bg-opacity-10 dark:bg-opacity-20 text-primary dark:text-primary-light" 
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          } mb-1`}>
            <i className="fab fa-telegram w-5 h-5 mr-2"></i>
            <span>Telegram Bot</span>
          </a>
        </Link>
        
        <Link href="/blog">
          <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
            isActive("/blog") 
              ? "bg-primary bg-opacity-10 dark:bg-opacity-20 text-primary dark:text-primary-light" 
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          } mb-1`}>
            <i className="fab fa-medium w-5 h-5 mr-2"></i>
            <span>Blog Makaleleri</span>
          </a>
        </Link>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-2 mt-6 px-3">Ayarlar</p>
        
        <Link href="/settings">
          <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
            isActive("/settings") 
              ? "bg-primary bg-opacity-10 dark:bg-opacity-20 text-primary dark:text-primary-light" 
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          } mb-1`}>
            <i className="fas fa-cog w-5 h-5 mr-2"></i>
            <span>Hesap Ayarları</span>
          </a>
        </Link>
      </nav>
      
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            {user?.profileImage ? (
              <img 
                src={user.profileImage} 
                alt="Kullanıcı profil resmi" 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <i className="fas fa-user text-gray-400"></i>
              </div>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.fullName || "Kullanıcı"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || "email@example.com"}</p>
          </div>
          <button 
            onClick={logout}
            className="ml-auto text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </aside>
  );
}
