const { dialog } = require('electron');
const fs = require('fs');
const { buildXmlContent } = require('./xml_utils/xmlBuilder');
const { parseXmlContent } = require('./xml_utils/xmlParser');

async function exportXml(mainWindow, translations, modInfo) {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Экспорт локализации в XML',
    defaultPath: (modInfo?.name || 'Localizations') + '_RU.xml',
    filters: [{ name: 'XML Files', extensions: ['xml'] }]
  });

  if (canceled || !filePath) return { success: false, canceled: true };

  const xmlContent = await buildXmlContent(translations);
  fs.writeFileSync(filePath, xmlContent, 'utf-8');
  return { success: true, filePath };
}

async function importXml(mainWindow) {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Импорт локализации из XML',
    filters: [{ name: 'XML Files', extensions: ['xml'] }],
    properties: ['openFile']
  });

  if (canceled || filePaths.length === 0) return { success: false, canceled: true };

  const xmlPath = filePaths[0];
  const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
  const translations = await parseXmlContent(xmlContent);
  return { success: true, translations, filePath: xmlPath };
}

module.exports = {
  exportXml,
  importXml
};
