export declare class PdfService {
    coverLetterPdf(params: {
        applicantName: string;
        coverLetter: string;
        companyName?: string;
        jobTitle?: string;
    }): Promise<Buffer>;
}
