import { BrowserRouter, Routes, Route } from 'react-router-dom';
import InstrumentList from '@/pages/InstrumentList';
import CreateOrder from '@/pages/CreateOrder';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground antialiased">
        <Routes>
          <Route path="/" element={<InstrumentList />} />
          <Route path="/order/:instrumentId" element={<CreateOrder />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
