import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App'

Sentry.init({
  dsn: 'https://b547885b9259facc94dbccb9a564c343@o4511431330955264.ingest.us.sentry.io/4511431336001536',
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
