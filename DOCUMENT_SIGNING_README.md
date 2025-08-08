# 📝 PandaDoc-Style Document Signing Platform

A comprehensive real-time document signing solution built for PdfPage.in, featuring all the capabilities of PandaDoc with enhanced user experience.

## 🚀 Features

### Core Functionality
- **Real-time Collaboration** - Live updates as signers interact with documents
- **Multi-signer Support** - Unlimited signers with role-based permissions
- **Advanced Signature Fields** - Signature, initial, date, and text fields
- **Drag & Drop Interface** - Intuitive document preparation
- **Mobile Responsive** - Sign anywhere, anytime on any device
- **Legal Compliance** - Legally binding e-signatures

### Advanced Features
- **Template Library** - Save and reuse signature templates
- **Audit Trail** - Complete signing history and analytics
- **Custom Branding** - White-label signing experience
- **API Integration** - RESTful API for third-party integrations
- **Webhook Support** - Real-time notifications to your systems
- **Bulk Sending** - Send multiple documents at once

## 🏗️ Architecture

### Frontend Components
```
src/
├── components/pdf-signing/
│   ├── PDFSigningStudio.tsx      # Main signing interface
│   ├── SignatureCreator.tsx      # Signature creation tools
│   ├── FieldEditor.tsx           # Signature field management
│   └── RealTimeStatus.tsx        # Live status updates
├── pages/
│   └── DocumentSigning.tsx       # Landing page
└── services/
    └── signingService.ts          # API and WebSocket service
```

### Backend Services
```
backend/
├── routes/
│   └── pdf-signing.js            # Signing API endpoints
├── services/
│   ├── emailService.js           # Email notifications
│   ├── pdfProcessor.js           # PDF manipulation
│   └── websocketService.js       # Real-time updates
└── models/
    ├── SigningSession.js         # Session data model
    └── SignatureField.js         # Field data model
```

## 🛠️ Setup & Installation

### 1. Install Dependencies

**Frontend:**
```bash
npm install socket.io-client
```

**Backend:**
```bash
npm install nodemailer ws
```

### 2. Environment Variables

Create `.env` files:

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:8080
REACT_APP_BASE_URL=https://pdfpage.in
```

**Backend (.env):**
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL
FRONTEND_URL=https://pdfpage.in

# Email sender
EMAIL_FROM=noreply@pdfpage.in
```

### 3. Start Services

**Backend:**
```bash
cd backend
npm install
npm start
```

**Frontend:**
```bash
npm install
npm start
```

## 📱 Usage

### 1. Access the Signing Platform
Navigate to: `https://pdfpage.in/document-signing`

### 2. Upload Document
- Drag and drop PDF file
- Or click to browse and select

### 3. Prepare Document
- Add signature fields by clicking tools
- Position fields on PDF pages
- Assign fields to specific signers
- Add signers with email addresses

### 4. Send for Signing
- Review document setup
- Add custom message
- Send invitations to signers

### 5. Real-time Tracking
- Monitor signing progress live
- Receive instant notifications
- Download completed documents

## 🔧 API Reference

### Create Signing Session
```javascript
POST /api/pdf-signing/create-session
Content-Type: multipart/form-data

{
  pdf: File,
  title: string,
  message: string,
  signers: Signer[],
  signatureFields: SignatureField[]
}
```

### Get Session Status
```javascript
GET /api/pdf-signing/status/:sessionId

Response: {
  sessionId: string,
  status: 'active' | 'completed',
  progress: {
    signed: number,
    total: number,
    percentage: number
  },
  signers: Signer[]
}
```

### Sign Document
```javascript
POST /api/pdf-signing/sign/:sessionId

{
  token: string,
  signatures: {
    fieldId: string,
    value: string
  }[]
}
```

## 🔄 Real-time Events

### WebSocket Events

**Client → Server:**
```javascript
// Join signing session
socket.emit('join_session', {
  sessionId: 'session_123',
  userId: 'user_456'
});
```

**Server → Client:**
```javascript
// Signer signed document
socket.on('signer_signed', {
  sessionId: 'session_123',
  signer: {
    id: 'signer_789',
    name: 'John Doe',
    status: 'signed'
  }
});

// Document completed
socket.on('document_completed', {
  sessionId: 'session_123',
  completedAt: '2024-01-15T10:30:00Z'
});
```

## 🎨 Customization

### Branding
Customize the signing experience:

```css
/* Custom colors */
:root {
  --primary-color: #your-brand-color;
  --secondary-color: #your-secondary-color;
}

/* Custom logo */
.signing-header {
  background-image: url('your-logo.png');
}
```

### Email Templates
Modify email templates in `backend/templates/`:
- `signing-invitation.html`
- `signing-reminder.html`
- `document-completed.html`

## 📊 Analytics & Reporting

### Signing Analytics
```javascript
// Get detailed analytics
const analytics = await signingService.getSigningAnalytics(sessionId);

// Returns:
{
  totalTime: 1800, // seconds
  signerAnalytics: [
    {
      signerId: 'signer_123',
      timeToSign: 300,
      deviceType: 'mobile',
      location: 'New York, US'
    }
  ]
}
```

### Audit Trail
Every action is logged:
- Document uploaded
- Signers added
- Fields positioned
- Invitations sent
- Documents signed
- Completion time

## 🔒 Security Features

### Data Protection
- **Encryption**: All data encrypted in transit and at rest
- **Access Control**: Token-based authentication
- **Audit Logging**: Complete activity tracking
- **GDPR Compliance**: Data privacy controls

### Legal Compliance
- **E-SIGN Act** compliant
- **UETA** compliant
- **eIDAS** regulation support
- **Digital certificates** for enhanced security

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
```bash
# Production environment variables
NODE_ENV=production
FRONTEND_URL=https://pdfpage.in
DATABASE_URL=your-database-url
REDIS_URL=your-redis-url
```

2. **SSL Configuration**
Ensure HTTPS for all endpoints

3. **Database Setup**
Configure persistent storage for:
- Signing sessions
- User data
- Audit logs

4. **CDN Setup**
Use CDN for:
- PDF file storage
- Static assets
- Email templates

## 📈 Performance Optimization

### Frontend
- **Code Splitting**: Lazy load signing components
- **Caching**: Cache PDF renders and signatures
- **Compression**: Optimize PDF file sizes

### Backend
- **Database Indexing**: Index session and user queries
- **Caching**: Redis for session data
- **File Storage**: Cloud storage for PDFs

## 🤝 Integration Examples

### CRM Integration
```javascript
// Salesforce integration
const session = await signingService.createSigningSession(
  pdfFile,
  `Contract for ${opportunity.name}`,
  'Please review and sign this contract.',
  [{ name: contact.name, email: contact.email }],
  signatureFields
);

// Update Salesforce with signing URL
await salesforce.updateOpportunity(opportunity.id, {
  signing_url: session.signingUrl
});
```

### Webhook Integration
```javascript
// Receive signing events
app.post('/webhook/signing', (req, res) => {
  const { event, sessionId, data } = req.body;
  
  switch (event) {
    case 'document_signed':
      // Update your system
      break;
    case 'document_completed':
      // Trigger next workflow step
      break;
  }
});
```

## 📞 Support

For technical support or questions:
- 📧 Email: support@pdfpage.in
- 📚 Documentation: https://docs.pdfpage.in
- 🐛 Issues: GitHub Issues

---

**Built with ❤️ for PdfPage.in** - Making document signing simple, secure, and efficient.
