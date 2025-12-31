export class StandardResponse<T> {
  message: string;
  data: T;

  static async basic<T>(
    message: string,
    data: Promise<T>,
  ): Promise<StandardResponse<T>> {
    // const dataValue = await data;
    return {
      message,
      data: await data,
    };
  }
}
