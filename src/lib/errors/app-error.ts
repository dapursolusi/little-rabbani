export class AppError extends Error {
  constructor(
    message: string,
    public readonly publicMessage: string = message
  ) {
    super(message);
    this.name = new.target.name;
  }
}
