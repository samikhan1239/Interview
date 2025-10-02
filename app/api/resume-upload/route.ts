import { NextRequest, NextResponse } from "next/server";
import PDFParser from "pdf2json";
import mammoth from "mammoth";

// Define types for pdf2json structure
interface PDFTextItem {
  R: { T: string }[];
}

interface PDFPage {
  Texts: PDFTextItem[];
}

interface PDFData {
  Pages: PDFPage[];
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    console.log("Starting file upload processing", {
      fileName: file?.name,
      fileSize: file?.size,
    });

    if (!file) {
      console.error("No file uploaded");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log("File buffer created", { bufferLength: buffer.length });
    let text = "";

    if (file.name.endsWith(".pdf")) {
      console.log("Processing PDF file:", file.name);
      try {
        const pdfParser = new PDFParser();
        text = await new Promise<string>((resolve, reject) => {
          pdfParser.on("pdfParser_dataReady", (pdfData: PDFData) => {
            const textContent = pdfData.Pages.map((page) =>
              page.Texts.map((txt) => decodeURIComponent(txt.R[0].T)).join(" ")
            ).join("\n");
            resolve(textContent);
          });
          pdfParser.on("pdfParser_dataError", (errMsg: { parserError: Error } | Error) => {
            if ('parserError' in errMsg) {
              reject(errMsg.parserError);
            } else {
              reject(errMsg);
            }
          });
          pdfParser.parseBuffer(buffer);
        });
        console.log("PDF parsed successfully", {
          textLength: text.length,
          extractedText: text.substring(0, 200),
        });
      } catch (pdfError) {
        console.error("PDF parsing error:", pdfError);
        return NextResponse.json(
          { error: "Failed to parse PDF file" },
          { status: 400 }
        );
      }
    } else if (file.name.endsWith(".docx")) {
      console.log("Processing DOCX file:", file.name);
      try {
        const { value } = await mammoth.extractRawText({ buffer });
        text = value;
        console.log("DOCX parsed successfully", {
          textLength: text.length,
          extractedText: text.substring(0, 200),
        });
      } catch (docxError) {
        console.error("DOCX parsing error:", docxError);
        return NextResponse.json(
          { error: "Failed to parse DOCX file" },
          { status: 400 }
        );
      }
    } else {
      console.error("Invalid file type", { fileName: file.name });
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and DOCX are supported." },
        { status: 400 }
      );
    }

    // Normalize text: remove extra spaces, fix common PDF artifacts
    const normalizedText = text.replace(/\s+/g, " ").trim();
    console.log("Normalized text:", normalizedText.substring(0, 200));

    // Improved regex for field extraction
    const nameMatch =
      normalizedText.match(
        /(?:Name|Full Name|Candidate)[:\s]*([\w\s]{2,50})(?:\n|$)/i
      ) || normalizedText.match(/^([\w\s]{2,50})(?:\s+\+?\d{1,3}|$)/i);

    const emailMatch =
      normalizedText.match(
        /(?:Email|E-mail)[:\s]*([\w.-]+@[\s\w.-]*\.\w+)/i
      ) || normalizedText.match(/([\w.-]+@[\s\w.-]*\.\w+)/i);

    const phoneMatch =
      normalizedText.match(
        /(?:Phone|Mobile|Contact)[:\s]*(\+?\d{1,3}\s*-?\s*\d{3}\s*-?\s*\d{3}\s*-?\s*\d{4})/i
      ) ||
      normalizedText.match(
        /(\+?\d{1,3}\s*-?\s*\d{3}\s*-?\s*\d{3}\s*-?\s*\d{4})/i
      );

    const extractedFields = {
      name: nameMatch ? nameMatch[1].trim() : null,
      email: emailMatch ? emailMatch[1].trim().replace(/\s+/g, "") : null,
      phone: phoneMatch ? phoneMatch[1].trim().replace(/\s+/g, "") : null,
      rawText: normalizedText,
    };

    console.log("Extracted fields:", extractedFields);

    return NextResponse.json(extractedFields);
  } catch (error) {
    console.error("Error processing file:", error);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}
