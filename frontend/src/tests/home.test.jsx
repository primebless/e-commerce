import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../app/store';
import HomePage from '../pages/HomePage';

describe('HomePage', () => {
  it('renders featured section', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/Featured Products/i)).toBeInTheDocument();
  });
});
