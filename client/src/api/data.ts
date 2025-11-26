import { AxiosError } from 'axios';
import api from './api';

export const getTrades = async () => {
  try {
    const response = await api.get('/api/data/trades');
    return response.data;
  } catch (e) {
    const error = e as AxiosError<{ message: string }>;
    console.error('Error fetching trades:', error);
    throw new Error(error.response?.data?.message || error.message);
  }
};

export const getTickers = async () => {
  try {
    const response = await api.get('/api/data/tickers');
    return response.data;
  } catch (e) {
    const error = e as AxiosError<{ message: string }>;
    console.error('Error fetching tickers:', error);
    throw new Error(error.response?.data?.message || error.message);
  }
};