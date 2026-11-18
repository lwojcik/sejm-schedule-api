export class SejmApiError extends Error {
  readonly url: string;
  readonly status: number | null;

  constructor({
    message,
    url,
    status,
  }: {
    message: string;
    url: string;
    status: number | null;
  }) {
    super(message);
    this.name = 'SejmApiError';
    this.url = url;
    this.status = status;
  }
}
