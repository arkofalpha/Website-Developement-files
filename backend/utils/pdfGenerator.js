import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate PDF report for an assessment
 */
export async function generatePDFReport(assessmentData, outputPath) {
  let browser = null;
  
  try {
    // Create HTML template
    const html = generateHTMLTemplate(assessmentData);
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    
    // Set content
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });
    
    await browser.close();
    
    return outputPath;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

/**
 * Generate HTML template for PDF
 */
function generateHTMLTemplate(data) {
  const { business, summary, themeScores, completedAt } = data;
  
  const getPerformanceBandColor = (band) => {
    switch (band) {
      case 'needs_improvement': return '#E53E3E';
      case 'below_average': return '#ED8936';
      case 'moderate': return '#ECC94B';
      case 'strong': return '#48BB78';
      default: return '#718096';
    }
  };

  const getPerformanceBandLabel = (band) => {
    if (!band) return 'N/A';
    return band.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Source Sans Pro', Arial, sans-serif;
      color: #1A202C;
      line-height: 1.6;
    }
    .header {
      background: #1A365D;
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .container {
      padding: 40px;
    }
    .summary-section {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    .summary-card {
      background: #F7FAFC;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      border: 2px solid #E2E8F0;
    }
    .summary-card h3 {
      font-size: 14px;
      color: #4A5568;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    .summary-card .value {
      font-size: 36px;
      font-weight: bold;
      color: #2B6CB0;
      margin-bottom: 5px;
    }
    .summary-card .label {
      font-size: 12px;
      color: #718096;
    }
    .performance-band {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 4px;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }
    .theme-scores {
      margin-top: 40px;
    }
    .theme-scores h2 {
      font-size: 24px;
      margin-bottom: 20px;
      color: #1A365D;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #E2E8F0;
    }
    th {
      background: #F7FAFC;
      font-weight: 600;
      color: #1A365D;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #E2E8F0;
      text-align: center;
      color: #718096;
      font-size: 12px;
    }
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Business Performance Assessment Report</h1>
    <p>${business.name}</p>
    <p style="margin-top: 10px; font-size: 14px;">Assessment Date: ${new Date(completedAt).toLocaleDateString()}</p>
  </div>

  <div class="container">
    <div class="summary-section">
      <div class="summary-card">
        <h3>Composite Score</h3>
        <div class="value">${summary.compositeMean?.toFixed(2)}/5</div>
        <div class="label">${summary.compositePercentage?.toFixed(1)}%</div>
      </div>
      <div class="summary-card">
        <h3>Performance Band</h3>
        <div style="margin-top: 15px;">
          <span class="performance-band" style="background: ${getPerformanceBandColor(summary.performanceBand)}">
            ${getPerformanceBandLabel(summary.performanceBand)}
          </span>
        </div>
      </div>
      <div class="summary-card">
        <h3>Business Sector</h3>
        <div class="value" style="font-size: 24px; margin-top: 15px;">${business.sector}</div>
      </div>
    </div>

    <div class="theme-scores">
      <h2>Performance by Theme</h2>
      <table>
        <thead>
          <tr>
            <th>Theme</th>
            <th>Mean Score</th>
            <th>Percentage</th>
            <th>Performance Band</th>
          </tr>
        </thead>
        <tbody>
          ${themeScores.map(ts => `
            <tr>
              <td><strong>${ts.themeName}</strong></td>
              <td>${ts.meanScore.toFixed(2)}/5</td>
              <td>${ts.percentage.toFixed(1)}%</td>
              <td>
                <span class="performance-band" style="background: ${getPerformanceBandColor(ts.performanceBand)}">
                  ${getPerformanceBandLabel(ts.performanceBand)}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>This report was generated on ${new Date().toLocaleString()}</p>
      <p style="margin-top: 5px;">For questions or support, please contact your program administrator.</p>
    </div>
  </div>
</body>
</html>
  `;
}

