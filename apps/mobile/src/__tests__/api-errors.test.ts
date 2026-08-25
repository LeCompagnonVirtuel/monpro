import { AxiosError, AxiosHeaders } from 'axios';
import { ApiError, extractApiError } from '../api/errors';

function makeAxiosError(status: number, data: unknown, code?: string): AxiosError {
  const err = new AxiosError('Request failed', code || String(status));
  err.response = {
    status,
    data,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
  return err;
}

describe('ApiError', () => {
  it('creates from axios error with response', () => {
    const axiosError = makeAxiosError(400, { message: 'Validation failed', error: 'BAD_REQUEST' });
    const apiError = ApiError.fromAxios(axiosError);
    expect(apiError.status).toBe(400);
    expect(apiError.code).toBe('BAD_REQUEST');
    expect(apiError.message).toBe('Validation failed');
  });

  it('creates from timeout error', () => {
    const axiosError = new AxiosError('timeout', 'ECONNABORTED');
    const apiError = ApiError.fromAxios(axiosError);
    expect(apiError.status).toBe(0);
    expect(apiError.code).toBe('TIMEOUT');
  });

  it('creates from network error', () => {
    const axiosError = new AxiosError('Network Error', 'ERR_NETWORK');
    const apiError = ApiError.fromAxios(axiosError);
    expect(apiError.status).toBe(0);
    expect(apiError.code).toBe('NETWORK_ERROR');
  });

  it('handles array messages', () => {
    const axiosError = makeAxiosError(400, { message: ['phone must be valid', 'name is required'] });
    const apiError = ApiError.fromAxios(axiosError);
    expect(apiError.message).toBe('phone must be valid');
  });
});

describe('extractApiError', () => {
  it('returns ApiError as-is', () => {
    const err = new ApiError(404, 'NOT_FOUND', 'Not found');
    expect(extractApiError(err)).toBe(err);
  });

  it('wraps unknown errors', () => {
    const err = extractApiError(new Error('something'));
    expect(err.code).toBe('UNKNOWN');
  });
});
