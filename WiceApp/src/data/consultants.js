import rawCsv from "./Members Directory Master List.csv?raw";

function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(current);
      rows.push(row);
      current = "";
      row = [];
      continue;
    }

    if (!inQuotes && char === ",") {
      row.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current);
  rows.push(row);
  return rows;
}

function normalize(value) {
  const text = value || "";
  return text.split("\u0000").join("").trim();
}

const rows = parseCsv(rawCsv);
const [headerRow = [], ...dataRows] = rows;
const headers = headerRow.map((h) => normalize(h));

function rowToRecord(row) {
  const record = {};
  headers.forEach((header, index) => {
    if (!header) return;
    record[header] = normalize(row[index]);
  });
  return record;
}

const consultants = dataRows
  .map((row, index) => {
    if (!row || row.length === 0) return null;
    const record = rowToRecord(row);
    const name = record["Full Name"];
    if (!name) return null;

    const location = record.Location || record["Location:"] || "";
    const headline = record["One-line Headline"] || "";
    const bio = record["Professional Bio"] || "";
    const languages = record["Languages Spoken"] || "";
    const linkedin = record["LinkedIn Profile"] || "";
    const image = record["Upload your profile picture"] || "";
    const email =
      record.Email ||
      record["Email Address"] ||
      record["Email address"] ||
      record["Work Email"] ||
      "";

    return {
      id: index + 1,
      name,
      location,
      headline,
      bio,
      languages,
      linkedin,
      image: image || null,
      email,
      skills: record.Skills || "",
      sectors: record.Sectors || "",
    };
  })
  .filter(Boolean);

export { consultants };
