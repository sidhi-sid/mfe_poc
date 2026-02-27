import { BrowserRouter, Routes, Route } from 'react-router-dom';
import InstrumentList from '@/pages/InstrumentList';
import CreateOrder from '@/pages/CreateOrder';

export function OmsRoutes() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<InstrumentList />} />
        <Route path="/order/:instrumentId" element={<CreateOrder />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename="/oms">
      <OmsRoutes />
    </BrowserRouter>
  );
}

export default App;
