import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import App from '../src/App';

jest.mock('axios');

describe('User Management App', () => {
  const mockUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', createdAt: '2024-01-01' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', createdAt: '2024-01-02' }
  ];

  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockUsers });
    axios.post.mockResolvedValue({ 
      data: { id: 3, name: 'New User', email: 'new@example.com', createdAt: '2024-01-03' }
    });
    axios.delete.mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should render user management header', async () => {
    render(<App />);
    expect(await screen.findByText('User Management')).toBeInTheDocument();
  });

  test('should display loading state initially', () => {
    render(<App />);
    expect(screen.getByText(/Loading users/i)).toBeInTheDocument();
  });

  test('should fetch and display users', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  test('should create new user', async () => {
    render(<App />);
    
    // Ждем загрузки пользователей
    await screen.findByText('John Doe');
    
    // Заполняем форму
    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'New User' }
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'new@example.com' }
    });
    
    // Отправляем форму
    fireEvent.click(screen.getByText('Add User'));
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:5215/api/users', {
        name: 'New User',
        email: 'new@example.com'
      });
    });
  });

  test('should delete user', async () => {
    render(<App />);
    
    // Ждем загрузки пользователей
    await screen.findByText('John Doe');
    
    // Нажимаем кнопку удаления у первого пользователя
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('http://localhost:5215/api/users/1');
    });
  });

  test('should show error when form is empty', async () => {
    render(<App />);
    
    await screen.findByText('John Doe');
    
    // Пытаемся отправить пустую форму
    fireEvent.click(screen.getByText('Add User'));
    
    expect(await screen.findByText('Please fill in all fields')).toBeInTheDocument();
  });
});