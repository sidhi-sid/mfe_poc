import { BrowserRouter, Routes, Route } from "react-router-dom";
import InstrumentList from "@/pages/InstrumentList";
import CreateOrder from "@/pages/CreateOrder";

export function App() {
  return (
    <BrowserRouter basename="/oms">
      <Routes>
        <Route path="/" element={<InstrumentList />} />
        <Route path="order/:instrumentId" element={<CreateOrder />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
