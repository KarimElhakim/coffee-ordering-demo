import { Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Layout } from './components/Layout';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </Layout>
  );
}

export default App;

