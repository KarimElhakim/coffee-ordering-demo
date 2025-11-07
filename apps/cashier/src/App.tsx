import { Routes, Route } from 'react-router-dom';
import { POS } from './pages/POS';
import { Payment } from './pages/Payment';
import { Layout } from './components/Layout';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<POS />} />
        <Route path="/payment/:orderId" element={<Payment />} />
      </Routes>
    </Layout>
  );
}

export default App;

