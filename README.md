# 🧚 Ticket Fairy

A magical web application that transforms video recordings into project tickets with AI-powered analysis and seamless export capabilities.

## 📽️ Demo

See a demo of Ticket Fairy here: https://youtu.be/QCUhXQOQN2M?si=hrnFz4za3q3Nvxpb

## ✨ Features

### 🎥 **Screen Recording**
- **Dual-stream recording** with webcam overlay and screen capture
- **Real-time webcam preview** with draggable positioning
- **3-second countdown** before recording starts
- **Automatic video saving** to local collection

### 🧚‍♀️ **AI Ticket Generation**
- **Summon Fairy** - AI-powered ticket creation from video content
- **3-second loading animation** with progress tracking
- **Smart ticket naming** and description generation

### 📤 **Export Options**
- **Export to Jira** (integration ready)
- **Export to Linear** (integration ready)  
- **Copy to Clipboard** with formatted ticket text
- **Ticket identification** - shows which ticket you're exporting

### 🎨 **Modern UI**
- **Responsive design** with Chakra UI components
- **Dark/light mode** support
- **Smooth animations** and transitions
- **Mobile-friendly** interface

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern browser with screen recording support (Chrome recommended)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd static-web

# Install dependencies
npm install

# Start development server
npm run client
```

The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
static-web/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── VideoPage.tsx           # Main recording interface
│   │   │   ├── LandingPage.tsx         # Homepage
│   │   │   ├── SummonFairyModal.tsx    # AI ticket generation
│   │   │   ├── ExportModal.tsx         # Export options
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   └── useScreenRecording.ts   # Recording logic
│   │   └── utils/
│   │       └── recordingHelpers.ts     # Browser compatibility
│   └── package.json
└── server/                 # Python backend (optional)
    ├── api.py
    └── jira_integration.py
```

## 🎯 Usage

### 1. **Record a Video**
- Click "Create Video" → "Record"
- Grant camera and screen permissions
- Select screen/tab to record
- Position webcam overlay as needed
- Click "Record" to start (3-second countdown)

### 2. **Generate Ticket**
- Click "✨ 🧚 TICKET ✨" on any video
- Click "Summon Fairy" 
- Wait for AI processing (3 seconds)
- Choose export method

### 3. **Export Ticket**
- **Jira**: Direct integration (coming soon)
- **Linear**: Direct integration (coming soon)
- **Copy Text**: Formatted ticket text to clipboard

## 🛠️ Technical Details

### **Recording Technology**
- **WebRTC** for screen capture and webcam access
- **MediaRecorder API** for video encoding
- **WebM/VP9** codec support for optimal quality
- **Real-time stream management** with proper cleanup

### **Browser Support**
- ✅ Chrome 80+
- ✅ Edge 80+
- ✅ Firefox 72+ (limited)
- ❌ Safari (no screen recording support)

### **State Management**
- **React hooks** for local state
- **Custom useScreenRecording** hook for recording logic
- **Context-free** architecture for simplicity

## 🔧 Development

### Available Scripts

```bash
# Development
npm run client          # Start dev server

# Production
npm run build          # Build for production
npm run preview        # Preview production build

# Code Quality
npm run lint           # Run ESLint
```

### Key Components

- **`VideoPage`** - Main recording interface with video collection
- **`useScreenRecording`** - Core recording logic and state management
- **`SummonFairyModal`** - AI ticket generation with loading animation
- **`ExportModal`** - Export options with ticket identification

## 🎨 Customization

### **Theming**
- Uses Chakra UI theme system
- Supports light/dark mode
- Customizable color schemes

### **Recording Settings**
- Configurable video quality (1920x1080 default)
- Adjustable frame rate (30fps default)
- Customizable webcam overlay size

## 🚧 Roadmap

- [ ] **Jira Integration** - Direct API connection
- [ ] **Linear Integration** - Direct API connection  
- [ ] **Cloud Storage** - Video hosting and sharing
- [ ] **Team Collaboration** - Multi-user support
- [ ] **Advanced AI** - Enhanced ticket analysis

## 📄 License

Private project - All rights reserved

---

**Made with ✨ by the Ticket Fairy team**
