const express = require('express');
const multer = require('multer');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/signing/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// In-memory storage for signing sessions (use Redis in production)
const signingSessions = new Map();
const activeConnections = new Map();

// Email transporter (configure with your email service)
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'join_session') {
        const { sessionId, userId } = data;
        
        if (!activeConnections.has(sessionId)) {
          activeConnections.set(sessionId, new Set());
        }
        
        activeConnections.get(sessionId).add({ ws, userId });
        
        // Send current session status
        const session = signingSessions.get(sessionId);
        if (session) {
          ws.send(JSON.stringify({
            type: 'session_status',
            data: session
          }));
        }
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    // Remove connection from all sessions
    activeConnections.forEach((connections, sessionId) => {
      connections.forEach(conn => {
        if (conn.ws === ws) {
          connections.delete(conn);
        }
      });
      
      if (connections.size === 0) {
        activeConnections.delete(sessionId);
      }
    });
  });
});

// Broadcast update to all session participants
function broadcastSessionUpdate(sessionId, updateData) {
  const connections = activeConnections.get(sessionId);
  if (connections) {
    const message = JSON.stringify({
      type: 'session_update',
      data: updateData
    });
    
    connections.forEach(({ ws }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

// @route   POST /api/pdf-signing/create-session
// @desc    Create a new signing session
// @access  Private
router.post('/create-session', upload.single('pdf'), async (req, res) => {
  try {
    const { title, message, signers, signatureFields } = req.body;
    const pdfFile = req.file;
    
    if (!pdfFile) {
      return res.status(400).json({ error: 'PDF file is required' });
    }
    
    // Generate unique session ID
    const sessionId = crypto.randomUUID();
    
    // Parse signers and signature fields
    const parsedSigners = JSON.parse(signers);
    const parsedFields = JSON.parse(signatureFields);
    
    // Create signing session
    const session = {
      id: sessionId,
      title,
      message,
      pdfPath: pdfFile.path,
      originalFilename: pdfFile.originalname,
      signers: parsedSigners.map(signer => ({
        ...signer,
        status: 'pending',
        signedAt: null,
        signatureData: null,
        accessToken: crypto.randomUUID()
      })),
      signatureFields: parsedFields,
      status: 'active',
      createdAt: new Date(),
      completedAt: null
    };
    
    signingSessions.set(sessionId, session);
    
    // Send signing invitations
    for (const signer of session.signers) {
      await sendSigningInvitation(session, signer);
    }
    
    res.json({
      success: true,
      sessionId,
      message: 'Signing session created successfully'
    });
    
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create signing session' });
  }
});

// @route   GET /api/pdf-signing/session/:sessionId
// @desc    Get signing session details
// @access  Public (with token)
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { token } = req.query;
    
    const session = signingSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Verify access token
    const signer = session.signers.find(s => s.accessToken === token);
    if (!signer) {
      return res.status(403).json({ error: 'Invalid access token' });
    }
    
    // Return session data (filtered for this signer)
    res.json({
      success: true,
      session: {
        id: session.id,
        title: session.title,
        message: session.message,
        signer: signer,
        signatureFields: session.signatureFields.filter(field => 
          field.assignedTo === signer.id
        ),
        status: session.status
      }
    });
    
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// @route   POST /api/pdf-signing/sign/:sessionId
// @desc    Sign a document
// @access  Public (with token)
router.post('/sign/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { token, signatures } = req.body;
    
    const session = signingSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Find signer
    const signerIndex = session.signers.findIndex(s => s.accessToken === token);
    if (signerIndex === -1) {
      return res.status(403).json({ error: 'Invalid access token' });
    }
    
    // Update signer status
    session.signers[signerIndex] = {
      ...session.signers[signerIndex],
      status: 'signed',
      signedAt: new Date(),
      signatureData: signatures
    };
    
    // Update signature fields
    signatures.forEach(sig => {
      const fieldIndex = session.signatureFields.findIndex(f => f.id === sig.fieldId);
      if (fieldIndex !== -1) {
        session.signatureFields[fieldIndex] = {
          ...session.signatureFields[fieldIndex],
          value: sig.value,
          signed: true
        };
      }
    });
    
    // Check if all signers have signed
    const allSigned = session.signers.every(s => s.status === 'signed');
    if (allSigned) {
      session.status = 'completed';
      session.completedAt = new Date();
      
      // Generate final signed PDF
      await generateSignedPDF(session);
      
      // Notify all participants
      broadcastSessionUpdate(sessionId, {
        type: 'document_completed',
        session: session
      });
    } else {
      // Broadcast signing update
      broadcastSessionUpdate(sessionId, {
        type: 'signer_signed',
        signer: session.signers[signerIndex]
      });
    }
    
    res.json({
      success: true,
      message: 'Document signed successfully',
      allSigned
    });
    
  } catch (error) {
    console.error('Sign document error:', error);
    res.status(500).json({ error: 'Failed to sign document' });
  }
});

// @route   GET /api/pdf-signing/download/:sessionId
// @desc    Download signed PDF
// @access  Private
router.get('/download/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = signingSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.status !== 'completed') {
      return res.status(400).json({ error: 'Document not yet completed' });
    }
    
    const signedPdfPath = path.join('uploads/signing/signed', `${sessionId}.pdf`);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${session.title}_signed.pdf"`);
    
    const fileStream = require('fs').createReadStream(signedPdfPath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// @route   GET /api/pdf-signing/status/:sessionId
// @desc    Get real-time session status
// @access  Private
router.get('/status/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = signingSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({
      success: true,
      status: {
        sessionId: session.id,
        title: session.title,
        status: session.status,
        signers: session.signers.map(signer => ({
          id: signer.id,
          name: signer.name,
          email: signer.email,
          status: signer.status,
          signedAt: signer.signedAt
        })),
        progress: {
          signed: session.signers.filter(s => s.status === 'signed').length,
          total: session.signers.length,
          percentage: Math.round(
            (session.signers.filter(s => s.status === 'signed').length / session.signers.length) * 100
          )
        },
        createdAt: session.createdAt,
        completedAt: session.completedAt
      }
    });
    
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Helper function to send signing invitation
async function sendSigningInvitation(session, signer) {
  const signingUrl = `${process.env.FRONTEND_URL}/sign-document/${session.id}?token=${signer.accessToken}`;
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Document Signing Request</h2>
      <p>Hello ${signer.name},</p>
      <p>You have been requested to sign the document: <strong>${session.title}</strong></p>
      ${session.message ? `<p><em>${session.message}</em></p>` : ''}
      <div style="margin: 30px 0;">
        <a href="${signingUrl}" 
           style="background-color: #3B82F6; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Sign Document
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">
        This link will expire in 30 days. If you have any questions, please contact the sender.
      </p>
    </div>
  `;
  
  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@pdfpage.in',
      to: signer.email,
      subject: `Please sign: ${session.title}`,
      html: emailHtml
    });
    
    console.log(`Signing invitation sent to ${signer.email}`);
  } catch (error) {
    console.error(`Failed to send invitation to ${signer.email}:`, error);
  }
}

// Helper function to generate signed PDF
async function generateSignedPDF(session) {
  try {
    // Read original PDF
    const pdfBytes = await fs.readFile(session.pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Add signatures to PDF
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    session.signatureFields.forEach(field => {
      if (field.signed && field.value) {
        const page = pages[field.page - 1];
        
        if (field.type === 'signature') {
          // Add signature image or text
          page.drawText(field.value, {
            x: field.x,
            y: page.getHeight() - field.y - field.height,
            size: 12,
            font,
            color: rgb(0, 0, 0.8)
          });
        } else if (field.type === 'date') {
          page.drawText(field.value, {
            x: field.x,
            y: page.getHeight() - field.y - field.height,
            size: 10,
            font,
            color: rgb(0, 0, 0)
          });
        } else if (field.type === 'text') {
          page.drawText(field.value, {
            x: field.x,
            y: page.getHeight() - field.y - field.height,
            size: 10,
            font,
            color: rgb(0, 0, 0)
          });
        }
      }
    });
    
    // Save signed PDF
    const signedPdfBytes = await pdfDoc.save();
    const signedDir = path.join('uploads/signing/signed');
    
    // Ensure directory exists
    await fs.mkdir(signedDir, { recursive: true });
    
    const signedPdfPath = path.join(signedDir, `${session.id}.pdf`);
    await fs.writeFile(signedPdfPath, signedPdfBytes);
    
    console.log(`Signed PDF generated: ${signedPdfPath}`);
    
  } catch (error) {
    console.error('Generate signed PDF error:', error);
    throw error;
  }
}

module.exports = router;
