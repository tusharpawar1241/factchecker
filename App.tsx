import React from 'react';
import Dashboard from './components/Dashboard';
import { SpeedInsights } from '@vercel/speed-insights/react';

const App: React.FC = () => (
  <>
    <Dashboard />
    <SpeedInsights />
  </>
);

export default App;