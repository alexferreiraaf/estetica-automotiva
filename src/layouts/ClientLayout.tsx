import { Outlet, Link } from 'react-router-dom';
import { Car } from 'lucide-react';

export function ClientLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-[#141414]/90 backdrop-blur-md border-b border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00f0ff] to-[#00b3cc] flex items-center justify-center p-[2px]">
                <div className="w-full h-full bg-[#141414] rounded-full flex items-center justify-center">
                  <Car className="text-[#00f0ff] w-5 h-5" />
                </div>
              </div>
              <span className="font-bold text-xl tracking-wide text-white">Auto<span className="text-[#00f0ff]">Aesthetics</span></span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-[#141414] border-t border-[#262626] py-6 text-center">
        <p className="text-sm text-gray-500">© 2026 Auto Aesthetics. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
