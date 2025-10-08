const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const ghostscriptDiagnostics = require('../utils/ghostscriptDiagnostics');

// @route GET /api/diagnostics/tools
// @desc  Check availability of Ghostscript, qpdf (CLI and node-qpdf) and PATH
// @access Public
router.get('/', async (req, res) => {
  try {
    const report = {
      timestamp: new Date().toISOString(),
      platform: {
        os: process.platform,
        arch: process.arch,
        node: process.version,
      },
      env: {
        PATH: process.env.PATH || null,
      },
      ghostscript: null,
      qpdf: {
        cli: { available: false, version: null, errors: [] },
        nodeLibrary: { available: false, error: null },
      },
    };

    // Ghostscript diagnostics (reuse existing util)
    try {
      report.ghostscript = await ghostscriptDiagnostics.generateDiagnosticReport();
    } catch (gsErr) {
      report.ghostscript = { available: false, error: gsErr && gsErr.message ? gsErr.message : String(gsErr) };
    }

    // qpdf CLI check
    try {
      // Try common command
      const { stdout } = await execAsync('qpdf --version', { timeout: 5000 });
      report.qpdf.cli.available = true;
      report.qpdf.cli.version = (stdout || '').trim();

      try {
        const whichCmd = process.platform === 'win32' ? 'where qpdf' : 'which qpdf';
        const { stdout: whichOut } = await execAsync(whichCmd, { timeout: 3000 });
        report.qpdf.cli.path = (whichOut || '').trim().split('\n')[0];
      } catch (whichErr) {
        report.qpdf.cli.path = null;
      }
    } catch (cliErr) {
      report.qpdf.cli.available = false;
      report.qpdf.cli.errors.push(cliErr && cliErr.message ? cliErr.message : String(cliErr));
    }

    // node-qpdf library check
    try {
      try {
        require.resolve('node-qpdf');
        report.qpdf.nodeLibrary.available = true;
      } catch (resolveErr) {
        report.qpdf.nodeLibrary.available = false;
        report.qpdf.nodeLibrary.error = 'node-qpdf not installed';
      }

      if (report.qpdf.nodeLibrary.available) {
        try {
          const qpdfLib = require('node-qpdf');
          report.qpdf.nodeLibrary.version = qpdfLib.version || null;
        } catch (libErr) {
          report.qpdf.nodeLibrary.available = false;
          report.qpdf.nodeLibrary.error = libErr && libErr.message ? libErr.message : String(libErr);
        }
      }
    } catch (error) {
      report.qpdf.nodeLibrary.available = false;
      report.qpdf.nodeLibrary.error = error && error.message ? error.message : String(error);
    }

    // Add helpful hints
    report.hints = [];
    if (!report.qpdf.cli.available) {
      report.hints.push('qpdf CLI not found on PATH. Install qpdf and ensure it is in PATH.');
    }
    if (!report.ghostscript || !report.ghostscript.ghostscript || !report.ghostscript.ghostscript.available) {
      report.hints.push('Ghostscript not available. Install Ghostscript and ensure it is in PATH.');
    }

    res.json({ success: true, report });
  } catch (error) {
    console.error('Error running tools diagnostic:', error && error.stack ? error.stack : error);
    res.status(500).json({ success: false, error: error && error.message ? error.message : String(error) });
  }
});

module.exports = router;
