import { PDFDocument, StandardFonts } from "pdf-lib";

export function formatCertificateCurrency(
  amount: number,
  currency?: string | null,
) {
  const value = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  const prefix = currency ? String(currency).toUpperCase() : "NGN";
  return `${prefix} ${formatted}`;
}

export async function buildCertificateOfHonorPdf(input: {
  requestLabel: string;
  voucherNumber: string;
  staffName: string;
  amountLabel: string;
  declaration: string;
  reason: string;
  issuedAt: string;
}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const marginX = 48;
  let y = 792;

  const write = (
    text: string,
    size = 11,
    isBold = false,
    indent = 0,
    lineGap = 18,
  ) => {
    if (y < 72) y = 792;
    page.drawText(text, {
      x: marginX + indent,
      y,
      size,
      font: isBold ? bold : regular,
    });
    y -= lineGap;
  };

  write("CERTIFICATE OF HONOR", 20, true);
  write("Cash Advance Retirement Declaration", 12, true);
  y -= 12;
  write(`Request: ${input.requestLabel}`, 11, true);
  write(`Payment Voucher: ${input.voucherNumber}`);
  write(`Staff Member: ${input.staffName}`);
  write(`Amount: ${input.amountLabel}`);
  write(`Date: ${input.issuedAt}`);
  y -= 8;
  write("Declaration", 13, true);
  [
    input.declaration ||
    "I hereby certify that the cash advance and/or disbursed funds referenced above were used for official purposes.",
    "Supporting receipts are not available for the full amount because:",
    input.reason || "No additional explanation provided.",
  ].forEach((line) => write(line, 11, false, 12, 16));
  y -= 10;
  write(
    "I accept responsibility for the accuracy of this declaration and understand it will",
    11,
    false,
    12,
    16,
  );
  write(
    "form part of the retirement record for this request.",
    11,
    false,
    12,
    16,
  );
  y -= 18;
  write("Signature: ____________________________", 11, false);
  write("Name: ________________________________", 11, false);

  const bytes = await pdf.save();
  const byteArrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  return new File(
    [byteArrayBuffer],
    `Certificate_of_Honor_${input.requestLabel.replace(/[\\/]+/g, "-")}.pdf`,
    {
      type: "application/pdf",
    },
  );
}
