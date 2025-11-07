import { Routes, Route } from 'react-router-dom';
import { POS } from './pages/POS';
import { Layout } from './components/Layout';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<POS />} />
      </Routes>
    </Layout>
  );
}

export default App;

