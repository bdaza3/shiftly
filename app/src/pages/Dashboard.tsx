import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

export const Dashboard = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p>Welcome back, user!</p>
        </main>
      </div>
    </div>
  );
};