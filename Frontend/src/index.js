import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import "bootstrap/dist/css/bootstrap.min.css";
import './localization/setup';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { store, persistor } from './store';
import { queryClient } from './api/queryClient';
import { setupAuthInterceptor } from './api/authSession';
import AppLoadingScreen from './components/loading/AppLoadingScreen';

setupAuthInterceptor();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={<AppLoadingScreen messageKey="loadingScreen.startingApp" />} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<AppLoadingScreen messageKey="loadingScreen.startingApp" />}>
            <App />
          </Suspense>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);

import('bootstrap/dist/js/bootstrap.bundle.min');

// If you want to start measuring performance in this app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
