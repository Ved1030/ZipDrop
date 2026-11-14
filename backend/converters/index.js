/**
 * Conversion Router
 * Central entry point for all conversions
 * Routes requests to appropriate converters
 */

const { ConversionError, ERROR_CODES, SUPPORTED_FORMATS, CONVERSION_CATEGORIES } = require('./types');
const { PdfToWordConverter } = require('./pdf-to-word');
const { WordToPdfConverter } = require('./word-to-pdf');
const { PdfToImageConverter } = require('./pdf-to-image');
const { ImageToPdfConverter } = require('./image-to-pdf');
const { ImageToImageConverter } = require('./image-to-image');
const { OfficeToPdfConverter } = require('./office-to-pdf');
const { PdfToExcelConverter } = require('./pdf-to-excel');
const { PdfToPptxConverter } = require('./pdf-to-pptx');
const { PdfToTextConverter } = require('./pdf-to-text');
const { PdfToHtmlConverter } = require('./pdf-to-html');
const { PdfToPdfaConverter } = require('./pdf-to-pdfa');

class ConversionRouter {
  constructor() {
    this.converters = new Map();
    this.initializeConverters();
  }

  initializeConverters() {
    // PDF to Word
    this.converters.set('pdf-to-docx', new PdfToWordConverter());

    // Office to PDF
    this.converters.set('docx-to-pdf', new WordToPdfConverter());
    this.converters.set('xlsx-to-pdf', new OfficeToPdfConverter());
    this.converters.set('pptx-to-pdf', new OfficeToPdfConverter());

    // PDF to Images
    this.converters.set('pdf-to-jpg', new PdfToImageConverter());
    this.converters.set('pdf-to-png', new PdfToImageConverter());

    // PDF to Excel
    this.converters.set('pdf-to-xlsx', new PdfToExcelConverter());

    // PDF to PowerPoint
    this.converters.set('pdf-to-pptx', new PdfToPptxConverter());

    // PDF to Text
    this.converters.set('pdf-to-txt', new PdfToTextConverter());

    // PDF to HTML
    this.converters.set('pdf-to-html', new PdfToHtmlConverter());

    // PDF to PDF/A
    this.converters.set('pdf-to-pdfa', new PdfToPdfaConverter());

    // Images to PDF
    this.converters.set('jpg-to-pdf', new ImageToPdfConverter());
    this.converters.set('png-to-pdf', new ImageToPdfConverter());
    this.converters.set('webp-to-pdf', new ImageToPdfConverter());
    this.converters.set('images-to-pdf', new ImageToPdfConverter());

    // Image to Image
    this.converters.set('jpg-to-png', new ImageToImageConverter());
    this.converters.set('png-to-jpg', new ImageToImageConverter());
    this.converters.set('webp-to-jpg', new ImageToImageConverter());
    this.converters.set('jpg-to-webp', new ImageToImageConverter());
    this.converters.set('png-to-webp', new ImageToImageConverter());
    this.converters.set('svg-to-png', new ImageToImageConverter());
  }

  getConverter(conversionKey) {
    const converter = this.converters.get(conversionKey);
    if (!converter) {
      throw new ConversionError(
        `Unsupported conversion: ${conversionKey}`,
        ERROR_CODES.UNSUPPORTED_FORMAT
      );
    }
    return converter;
  }

  parseConversionKey(inputFormat, outputFormat) {
    return `${inputFormat}-to-${outputFormat}`;
  }

  async convert({ inputBuffer, inputFormat, outputFormat, options = {} }) {
    const conversionKey = this.parseConversionKey(inputFormat, outputFormat);
    const converter = this.getConverter(conversionKey);

    return converter.convert({ inputBuffer, inputFormat, outputFormat, options });
  }

  async convertMultiple({ inputBuffers, inputFormats, outputFormat, options = {} }) {
    // For multi-input conversions like images-to-pdf
    const conversionKey = 'images-to-pdf';
    const converter = this.getConverter(conversionKey);

    return converter.convert({
      inputBuffer: inputBuffers,
      inputFormat: inputFormats,
      outputFormat,
      options
    });
  }

  isConversionSupported(inputFormat, outputFormat) {
    const conversionKey = this.parseConversionKey(inputFormat, outputFormat);
    return this.converters.has(conversionKey) ||
           (inputFormat === 'images' && outputFormat === 'pdf');
  }

  getSupportedConversions() {
    const conversions = [];
    for (const [key, converter] of this.converters) {
      // Extract input/output from key
      const match = key.match(/^(.+)-to-(.+)$/);
      if (match) {
        conversions.push({
          key,
          inputFormat: match[1],
          outputFormat: match[2],
          category: this.getCategory(key),
        });
      }
    }
    return conversions;
  }

  getCategory(conversionKey) {
    for (const [category, keys] of Object.entries(CONVERSION_CATEGORIES)) {
      if (keys.includes(conversionKey)) {
        return category;
      }
    }
    return 'other';
  }

  getCategories() {
    return Object.keys(CONVERSION_CATEGORIES);
  }

  getConversionsByCategory(category) {
    const keys = CONVERSION_CATEGORIES[category] || [];
    return keys.map(key => {
      const converter = this.converters.get(key);
      if (!converter) return null;
      const match = key.match(/^(.+)-to-(.+)$/);
      return {
        key,
        inputFormat: match?.[1],
        outputFormat: match?.[2],
        category,
      };
    }).filter(Boolean);
  }
}

// Singleton instance
let routerInstance = null;

function getRouter() {
  if (!routerInstance) {
    routerInstance = new ConversionRouter();
  }
  return routerInstance;
}

module.exports = { ConversionRouter, getRouter };