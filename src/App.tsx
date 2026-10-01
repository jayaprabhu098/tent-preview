import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Configurator } from '@/components/Configurator'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Configurator />} />
        <Route path="/embed" element={<Configurator embed />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
