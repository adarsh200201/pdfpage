# PDF Editing Web Application

This is a web application for PDF editing with features similar to LightPDF. Below is a list of libraries used and their purposes in the application.

## Core PDF Processing

### 1. PDF.js

- **Purpose**: Render PDF documents in the browser
- **Features**:
  - Display PDFs with high fidelity
  - Text layer extraction
  - Page rendering and navigation
  - Zoom and rotation
- **Website**: [Mozilla PDF.js](https://mozilla.github.io/pdf.js/)

### 2. PDF-Lib

- **Purpose**: PDF modification and creation
- **Features**:
  - Edit existing PDFs
  - Add/remove pages
  - Modify text and images
  - Fill forms
- **Website**: [PDF-Lib](https://pdf-lib.js.org/)

## Frontend

### 3. React

- **Purpose**: UI component library
- **Features**:
  - Component-based architecture
  - State management
  - Virtual DOM for performance
- **Website**: [React](https://reactjs.org/)

### 4. TypeScript

- **Purpose**: Type checking and better developer experience
- **Features**:
  - Static typing
  - Better code completion
  - Early error detection
- **Website**: [TypeScript](https://www.typescriptlang.org/)

### 5. Tailwind CSS

- **Purpose**: Utility-first CSS framework
- **Features**:
  - Responsive design
  - Customizable design system
  - Dark mode support
- **Website**: [Tailwind CSS](https://tailwindcss.com/)

## Backend

### 6. Node.js with Express

- **Purpose**: Server-side runtime and framework
- **Features**:
  - API endpoints
  - File uploads and processing
  - Authentication
- **Website**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/)

### 7. Multer

- **Purpose**: File upload handling
- **Features**:
  - Handle multipart/form-data
  - File validation
  - Storage configuration
- **Website**: [Multer](https://github.com/expressjs/multer)

## Additional Tools

### 8. React Dropzone

- **Purpose**: File drag and drop functionality
- **Features**:
  - Drag and drop interface
  - File type validation
  - Preview support
- **Website**: [React Dropzone](https://react-dropzone.js.org/)

### 9. React Icons

- **Purpose**: Icon library
- **Features**:
  - Popular icon sets
  - Easy to use
  - Customizable
- **Website**: [React Icons](https://react-icons.github.io/react-icons/)

### 10. React Hot Toast

- **Purpose**: Notifications
- **Features**:
  - Toast notifications
  - Customizable
  - Promise API
- **Website**: [React Hot Toast](https://react-hot-toast.com/)

## Development Tools

### 11. Vite

- **Purpose**: Build tool and development server
- **Features**:
  - Fast development server
  - Optimized builds
  - Hot module replacement
- **Website**: [Vite](https://vitejs.dev/)

### 12. ESLint & Prettier

- **Purpose**: Code quality and formatting
- **Features**:
  - Code linting
  - Automatic code formatting
  - Customizable rules
- **Websites**: [ESLint](https://eslint.org/), [Prettier](https://prettier.io/)

## Complete Toolset Similar to LightPDF

### 1. PDF Viewing & Basic Tools

- **PDF.js** - Core PDF rendering
- **pdfjs-dist** - Distribution files for PDF.js
- **react-pdf** - React wrapper for PDF.js
- **pdf-viewer-reactjs** - Enhanced PDF viewer component
- **react-pdf-highlighter** - For text highlighting

### 2. PDF Editing

- **PDF-Lib** - Core PDF manipulation
- **pdf-lib** - Create and modify PDFs
- **react-signature-canvas** - For signatures
- **signature_pad** - Smooth signature drawing
- **fabric.js** - For canvas-based editing

### 3. File Conversion

- **pdf2pic** - PDF to image conversion
- **jspdf** - Generate PDFs from HTML/JS
- **html2canvas** - Convert HTML to canvas/PDF
- **docx-pdf** - DOCX to PDF conversion
- **xlsx-to-json** - Excel to PDF conversion
- **pdf-image** - PDF to image conversion
- **pdf-merger-js** - Merge multiple PDFs

### 4. Text & OCR

- **Tesseract.js** - OCR functionality
- **pdf-parse** - Extract text from PDF
- **pdf-text-extract** - Text extraction
- **pdf-extract** - Advanced text extraction
- **node-nlp** - Natural language processing

### 5. Security & Signatures

- **node-forge** - Cryptography for e-signatures
- **crypto-js** - Encryption/Decryption
- **jsonwebtoken** - Authentication
- **bcryptjs** - Password hashing
- **pdf-signature** - Digital signatures

### 6. Cloud & Storage

- **aws-sdk** - AWS S3 integration
- **firebase** - Firebase storage
- **dropbox** - Dropbox API
- **google-auth-library** - Google Drive API
- **axios** - API requests

### 7. UI Components

- **@material-ui/core** - UI components
- **@material-ui/icons** - Icons
- **react-dropzone** - File upload
- **react-toastify** - Notifications
- **react-contextmenu** - Context menus
- **react-draggable** - Draggable elements
- **react-resizable** - Resizable components
- **react-color** - Color picker

### 8. Development Tools

- **TypeScript** - Type checking
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing
- **Cypress** - E2E testing
- **Storybook** - Component development
- **Webpack** - Module bundler
- **Babel** - JavaScript compiler

### 9. Performance & Optimization

- **workbox** - Service workers
- **compression** - Gzip compression
- **lru-cache** - Caching
- **react-window** - Virtualized lists
- **reselect** - Memoized selectors

### 10. Collaboration & Real-time

- **socket.io** - Real-time communication
- **socket.io-client** - Client-side sockets
- **quill** - Rich text editor
- **yjs** - Real-time collaboration
- **hocuspocus** - Collaboration backend

### 11. Additional Tools

- **file-saver** - Save files client-side
- **jszip** - Create/Extract zip files
- **moment.js** - Date handling
- **uuid** - Generate unique IDs
- **lodash** - Utility functions
- **classnames** - Conditional class names
- **redux** / **mobx** - State management
- **react-router** - Routing
- **formik** / **react-hook-form** - Form handling

### 12. Build & Deployment

- **Docker** - Containerization
- **nginx** - Web server
- **pm2** - Process manager
- **husky** - Git hooks
- **lint-staged** - Lint staged files
- **cross-env** - Cross-platform env variables

## Getting Started

1. Install dependencies:

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

2. Set up environment variables (create .env files in both frontend and backend)

3. Start development servers:

```bash
# Frontend
cd frontend
npm run dev

# Backend
cd ../backend
npm run dev
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
