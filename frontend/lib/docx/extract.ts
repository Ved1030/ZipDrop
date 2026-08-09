/**
 * DOCX ZIP extractor — extracts OOXML files and parses into document model.
 */

import JSZip from "jszip";
import { DocxDocument } from "./types";
import { parseDocxFiles, DocxFiles } from "./parser";

export async function extractDocx(arrayBuffer: ArrayBuffer): Promise<DocxDocument> {
  const zip = await JSZip.loadAsync(arrayBuffer);

  const files: DocxFiles = {};

  const docFile = zip.file("word/document.xml");
  if (docFile) files.document = await docFile.async("text");

  const stylesFile = zip.file("word/styles.xml");
  if (stylesFile) files.styles = await stylesFile.async("text");

  const numberingFile = zip.file("word/numbering.xml");
  if (numberingFile) files.numbering = await numberingFile.async("text");

  const themeFile = zip.file("word/theme/theme1.xml");
  if (themeFile) files.theme = await themeFile.async("text");

  const settingsFile = zip.file("word/settings.xml");
  if (settingsFile) files.settings = await settingsFile.async("text");

  const coreFile = zip.file("docProps/core.xml");
  if (coreFile) files.core = await coreFile.async("text");

  return parseDocxFiles(files);
}
