import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import TrenchList from '@/pages/TrenchList';
import TrenchView from '@/pages/TrenchView';
import StrataEditor from '@/pages/StrataEditor';
import ArtifactMarker from '@/pages/ArtifactMarker';
import PhotoGallery from '@/pages/PhotoGallery';
import Analytics from '@/pages/Analytics';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<TrenchList />} />
          <Route path="/trench/:id" element={<TrenchView />} />
          <Route path="/trench/:id/strata" element={<StrataEditor />} />
          <Route path="/trench/:id/artifacts" element={<ArtifactMarker />} />
          <Route path="/trench/:id/photos" element={<PhotoGallery />} />
          <Route path="/trench/:id/analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </Router>
  );
}
