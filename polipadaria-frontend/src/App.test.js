import { render, screen } from '@testing-library/react';
import App from './App';
import { BASE_DB } from './constants/dataModel';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(BASE_DB),
    })
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders app title', async () => {
  render(<App />);
  expect(await screen.findByText('Maria Silva')).toBeInTheDocument();
  const titleElement = screen.getByText(/polipadaria/i);
  expect(titleElement).toBeInTheDocument();
});

test('loads rows from the sqlite api', async () => {
  render(<App />);
  expect(await screen.findByText('Maria Silva')).toBeInTheDocument();
});
