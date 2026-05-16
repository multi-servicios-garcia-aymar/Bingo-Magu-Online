export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries: number; delay: number } = { retries: 3, delay: 1000 }
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < opts.retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (i < opts.retries - 1) {
        await new Promise(resolve => setTimeout(resolve, opts.delay * (i + 1)));
      }
    }
  }
  throw lastError;
}
