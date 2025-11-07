import { Routes, Route } from 'react-router-dom';
import { Menu } from './pages/Menu';
import { Checkout } from './pages/Checkout';
import { OrderStatus } from './pages/OrderStatus';
import { Payment } from './pages/Payment';
import { Layout } from './components/Layout';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment/:orderId" element={<Payment />} />
        <Route path="/order/:orderId" element={<OrderStatus />} />
      </Routes>
    </Layout>
  );
}

export default App;

