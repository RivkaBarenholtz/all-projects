import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import   {BrowserRouter} from 'react-router-dom'

import App from './App.jsx'

const basename = process.env.NODE_ENV === 'development' || window.location.hostname === 'pay.instechpay.co' ? '/' : '/app/';

createRoot(document.getElementById('root')).render(
  <StrictMode>
     <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
