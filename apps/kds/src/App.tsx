import { Routes, Route } from 'react-router-dom';
import { KDS } from './pages/KDS';
import { Layout } from './components/Layout';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<KDS />} />
      </Routes>
    </Layout>
  );
}

export default App;

