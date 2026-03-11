import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import InstrumentList from "@/pages/InstrumentList";
import CreateOrder from "@/pages/CreateOrder";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
  },
});

/** Inner app that uses TanStack Query hooks; must be rendered inside QueryClientProvider. */
function OmsContent() {
  return (
    <BrowserRouter basename="/oms">
      <Routes>
        <Route path="/" element={<InstrumentList />} />
        <Route path="order/:instrumentId" element={<CreateOrder />} />
      </Routes>
    </BrowserRouter>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OmsContent />
    </QueryClientProvider>
  );
}

export default App;
