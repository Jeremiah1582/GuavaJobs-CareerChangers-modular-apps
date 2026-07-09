export declare class CvParseService {
    private readonly logger;
    extractText(buffer: Buffer, mimeType: string, fileName: string): Promise<string>;
    private parsePdf;
    private parseDocx;
}
