import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { store } from '../app/store';
import HomePage from '../pages/HomePage';

describe('HomePage', () => {
  it('renders featured section', () => {
    render(
      <Provider store={store}>
        <HelmetProvider>
          <BrowserRouter>
            <HomePage />
          </BrowserRouter>
        </HelmetProvider>
      </Provider>
    );

    expect(screen.getByText(/Featured Products/i)).toBeInTheDocument();
  });
});
