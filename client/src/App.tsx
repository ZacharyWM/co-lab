import { Routes, Route } from 'react-router-dom';

import NameEntry from './components/NameEntry';
import Workspace from './components/Workspace';
import { AppProvider } from './hooks/useAppContext';

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<NameEntry />} />
          <Route path="/workspace" element={<Workspace />} />
        </Routes>
      </div>
    </AppProvider>
  );
}

export default App;
