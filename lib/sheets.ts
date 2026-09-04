import { google } from "googleapis";

const SHEET_NAME = "Carrosséis";

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error(
      "Variáveis GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY não configuradas."
    );
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetId() {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) {
    throw new Error("Variável GOOGLE_SHEET_ID não configurada.");
  }
  return id;
}

export async function readSheetRows(): Promise<string[][]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = getSheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:N200`,
  });

  return res.data.values ?? [];
}

export async function updateStatusCell(
  rowNumber: number,
  status: string
): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = getSheetId();

  // Coluna B é "status" na planilha modelo.
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!B${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[status]],
    },
  });
}
