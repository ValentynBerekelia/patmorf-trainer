import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Flashcards from './pages/Flashcards';
import Exam from './pages/Exam';
import Weak from './pages/Weak';
import Catalog from './pages/Catalog';
import PreparationDetail from './pages/PreparationDetail';
import Stats from './pages/Stats';
import { ProgressProvider } from './context/ProgressContext';

export default function App() {
  return (
    <ProgressProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="quiz" element={<Quiz />} />
            <Route path="cards" element={<Flashcards />} />
            <Route path="exam" element={<Exam />} />
            <Route path="weak" element={<Weak />} />
            <Route path="catalog" element={<Catalog />} />
            <Route path="catalog/:id" element={<PreparationDetail />} />
            <Route path="stats" element={<Stats />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ProgressProvider>
  );
}
