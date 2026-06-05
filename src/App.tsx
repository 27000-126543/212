import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Pads from '@/pages/base/Pads';
import Rockets from '@/pages/base/Rockets';
import Payloads from '@/pages/base/Payloads';
import Windows from '@/pages/base/Windows';
import Personnel from '@/pages/base/Personnel';
import Schedule from '@/pages/Schedule';
import Tasks from '@/pages/Tasks';
import Execution from '@/pages/Execution';
import Monitor from '@/pages/Monitor';
import Maintenance from '@/pages/Maintenance';
import Statistics from '@/pages/Statistics';
import SiteMap from '@/pages/SiteMap';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/base/pads" element={<Pads />} />
          <Route path="/base/rockets" element={<Rockets />} />
          <Route path="/base/payloads" element={<Payloads />} />
          <Route path="/base/windows" element={<Windows />} />
          <Route path="/base/personnel" element={<Personnel />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/execution" element={<Execution />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/sitemap" element={<SiteMap />} />
        </Route>
      </Routes>
    </Router>
  );
}
