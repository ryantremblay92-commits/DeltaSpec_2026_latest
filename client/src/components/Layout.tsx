import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
}