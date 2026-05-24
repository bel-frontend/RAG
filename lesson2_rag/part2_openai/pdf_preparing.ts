import { loadPDFDocuments } from "./pdf_loader/pdf-loader";
import fs from "fs";

const docs = await loadPDFDocuments("./pdf_documents/");
const fullText = docs
  .reduce((acc, item) => {
    return acc + item.pageContent;
  }, "")
  .replace(/[-\r\n]+/g, "");

console.log(fullText, fullText.length);

fs.writeFileSync("./preparedText/fulltext.txt", fullText);
