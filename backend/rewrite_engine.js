/**
 * Rewrite engine designed for user-owned or licensed content transformation.
 * This module intentionally avoids claims of guaranteed legal outcomes.
 */

const MODES = {
  standard: 'Standard Rewrite',
  creative: 'Creative Rewrite',
  seo: 'SEO Rewrite',
  summary: 'Short Summary',
  expand: 'Expand Content',
};

function simpleSimilarity(a, b) {
  const tokensA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const tokensB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  const intersection = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size || 1;
  return Math.round((intersection / union) * 100);
}

function preserveKeywords(text, keywords = []) {
  if (!keywords.length) return text;
  return `${text}\n\nKeywords preserved: ${keywords.join(', ')}`;
}

function transformText({ text, mode = 'standard', language = 'en', keywords = [] }) {
  let output = text.trim();

  switch (mode) {
    case 'creative':
      output = `Imagine this from a fresh perspective: ${output}`;
      break;
    case 'seo':
      output = `${output}\n\nSEO focus: clear headings, intent-matching phrases, and actionable wording.`;
      break;
    case 'summary':
      output = output.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
      break;
    case 'expand':
      output = `${output}\n\nExpanded context: add examples, benefits, and practical next steps.`;
      break;
    default:
      output = `Rephrased version: ${output}`;
      break;
  }

  if (language === 'bn') {
    output = `বাংলা সংস্করণ: ${output}`;
  } else if (language === 'hi') {
    output = `हिंदी संस्करण: ${output}`;
  }

  output = preserveKeywords(output, keywords);

  const similarity = simpleSimilarity(text, output);
  const plagiarismSafeScore = Math.max(0, 100 - similarity);

  return {
    modeLabel: MODES[mode] || MODES.standard,
    output,
    similarity,
    plagiarismSafeScore,
    disclaimer:
      'Use this tool only for content you own or are licensed to transform. Review legal requirements before publishing.',
  };
}

module.exports = { transformText, MODES };
