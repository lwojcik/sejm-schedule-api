import { SejmApiError } from '@sejm/errors';

export const fetchJson = async (url: string): Promise<unknown> => {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new SejmApiError({
      message: `${url} answered ${response.status}`,
      url,
      status: response.status,
    });
  }

  return response.json();
};
