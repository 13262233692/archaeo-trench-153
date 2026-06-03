import { Outlet, Link, useParams, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Box, 
  Layers, 
  MapPin, 
  Image, 
  BarChart3,
  ChevronLeft,
  Plus
} from 'lucide-react';

export default function Layout() {
  const { id } = useParams();
  const navigate = useNavigate();

  const navItems = id ? [
    { path: `/trench/${id}`, label: '三维视图', icon: Box },
    { path: `/trench/${id}/strata`, label: '地层编辑', icon: Layers },
    { path: `/trench/${id}/artifacts`, label: '遗物标注', icon: MapPin },
    { path: `/trench/${id}/photos`, label: '照片管理', icon: Image },
    { path: `/trench/${id}/analytics`, label: '数据分析', icon: BarChart3 },
  ] : [];

  return (
    <div className="flex h-screen bg-stone-100">
      <aside className="w-64 bg-stone-800 text-stone-100 flex flex-col">
        <div className="p-4 border-b border-stone-700">
          <h1 className="text-xl font-bold text-amber-400">考古探方平台</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-stone-700 transition-colors"
          >
            <Home size={20} />
            <span>探方列表</span>
          </Link>
          
          {id && (
            <>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-stone-700 transition-colors text-stone-300"
              >
                <ChevronLeft size={20} />
                <span>返回列表</span>
              </button>
              
              <div className="h-px bg-stone-700 my-4" />
              
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-stone-700 transition-colors"
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>
        
        <div className="p-4 border-t border-stone-700">
          <p className="text-xs text-stone-400">v1.0.0</p>
        </div>
      </aside>
      
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
