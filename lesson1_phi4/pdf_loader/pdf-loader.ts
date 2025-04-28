import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';

export async function loadPDFDocuments(directory: string) {
    console.log('Loading PDFs from the specified directory...');
    const directoryLoader = new DirectoryLoader(directory, {
        '.pdf': (path: string) => new PDFLoader(path),
    });
    const docs = await directoryLoader.load();
    console.log(`Loaded ${docs.length} PDF documents.`);
    return docs;
}
