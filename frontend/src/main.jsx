import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { store } from './app/store';
import App from './App';
import './styles/global.css';
import ToastHost from './components/ToastHost';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <BrowserRouter>
          <App />
          <ToastHost />
        </BrowserRouter>
      </Provider>
    </HelmetProvider>
  </React.StrictMode>
);
