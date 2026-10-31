import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css.ts';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Provider } from 'react-redux';
import store from 'store';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={process.env['REACT_APP_GOOGLE_OAUTH_CLIENT_ID'] as string}>
      <Provider store={store}>
        <App />
      </Provider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
