/** Error whose message is safe to show to users. */
export class ProviderError extends Error {
  constructor(public readonly publicMessage: string, options?: ErrorOptions) {
    super(publicMessage, options);
    this.name = "ProviderError";
  }
}
