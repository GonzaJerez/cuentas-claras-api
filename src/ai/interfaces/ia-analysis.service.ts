export interface IProviderService {
  analyzeAudio(file: Buffer, mimeType: string, prompt: string): Promise<string>;

  analyzeImages(
    images: Array<{ buffer: Buffer; mimeType: string }>,
    prompt: string,
  ): Promise<string>;
}
