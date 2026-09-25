import { AppProviders } from './providers'
import { AppRoutes } from './routes'
import { BrowserRouter } from "react-router";
import './styles/index.css'

export function App() {
  return <AppProviders>
    <BrowserRouter>
        <AppRoutes />
    </BrowserRouter>
  </AppProviders>
}
