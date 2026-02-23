import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import InstrumentList from '@/pages/InstrumentList';
import CreateOrder from '@/pages/CreateOrder';

export function OmsRoutes() {
  return (
    <div>
      <Routes>
        <Route index element={<InstrumentList />} />
        <Route path="order/:instrumentId" element={<CreateOrder />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <OmsRoutes />
    </BrowserRouter>
  );
}

export default App;
