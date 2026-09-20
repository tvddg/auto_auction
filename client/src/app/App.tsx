import { AuthPage } from '@/pages/auth'

import { AppProviders } from './providers'
import './styles/index.css'

export const App = () => (
  <AppProviders>
    <AuthPage />
  </AppProviders>
)
