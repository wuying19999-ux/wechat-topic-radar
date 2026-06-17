import fs from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";

const uploadDir = path.resolve("knowledge_uploads");
const outputFile = path.resolve("netlify/functions/_shared/knowledge.generated.js");

const schoolRules = [
  { school: "UCL", country: "英国", keywords: ["UCL", "ucl"] },
  { school: "KCL", country: "英国", keywords: ["KCL", "伦敦国王", "King's"] },
  { school: "曼彻斯特大学", country: "英国", keywords: ["曼彻斯特", "Manchester"] },
  { school: "华威大学", country: "英国", keywords: ["华威", "Warwick"] },
  { school: "格拉斯哥大学", country: "英国", keywords: ["格拉", "Glasgow"] },
  { school: "布里斯托大学", country: "英国", keywords: ["布里斯托", "Bristol"] },
  { school: "悉尼大学", country: "澳洲", keywords: ["悉尼", "USYD", "Sydney"] },
  { school: "墨尔本大学", country: "澳洲", keywords: ["墨尔本", "Melbourne"] },
  { school: "香港地区", country: "香港", keywords: ["香港", "港"] }
];

function detectSchool(fileName) {
  return (
    schoolRules.find((rule) =>
      rule.keywords.some((keyword) => fileName.toLowerCase().includes(keyword.toLowerCase()))
    ) || { school: "未知学校", country: "未知地区" }
  );
}

function detectSourceType(fileName) {
  if (fileName.includes("聊天记录") || fileName.includes("沉淀库")) {
    return "聊天记录沉淀库";
  }

  if (fileName.includes("手册") || fileName.includes("资料")) {
    return "上传资料";
  }

  return "上传资料";
}

function detectModule(text) {
  const lower = text.toLowerCase();

  if (lower.includes("语言班") || lower.includes("pre-sessional")) return "language";
  if (lower.includes("机票") || lower.includes("航班") || lower.includes("行李") || lower.includes("接机")) return "flight";
  if (lower.includes("二手") || lower.includes("床垫") || lower.includes("转卖")) return "secondhand";
  if (lower.includes("选课") || lower.includes("学院") || lower.includes("专业") || lower.includes("导师")) return "college";

  return "alumni";
}

function chunkText(text, size = 800, overlap = 120) {
  const clean = text.replace(/\s+/g, " ").trim();
  const chunks = [];

  for (let start = 0; start < clean.length; start += size - overlap) {
    const chunk = clean.slice(start, start + size).trim();
    if (chunk.length >= 80) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

const files = await fs.readdir(uploadDir);
const docxFiles = files.filter((file) => file.toLowerCase().endsWith(".docx"));

const chunks = [];

for (const fileName of docxFiles) {
  const filePath = path.join(uploadDir, fileName);
  const result = await mammoth.extractRawText({ path: filePath });
  const { school, country } = detectSchool(fileName);
  const sourceType = detectSourceType(fileName);
  const textChunks = chunkText(result.value);

  textChunks.forEach((text, index) => {
    chunks.push({
      id: `${school}-${fileName}-${index + 1}`,
      school,
      country,
      moduleId: detectModule(text),
      sourceType,
      sourceTitle: fileName,
      text
    });
  });
}

const output = `export const generatedKnowledgeChunks = ${JSON.stringify(chunks, null, 2)};\n`;

await fs.writeFile(outputFile, output, "utf8");

console.log(`已导入 ${docxFiles.length} 个 docx 文件，生成 ${chunks.length} 条资料片段。`);
console.log(`输出文件：${outputFile}`);