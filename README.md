# Fortress Notes

Fortress Notes is a secure, client-side encrypted note-taking application designed for privacy and ease of use. It functions like a digital vault where your data is encrypted in your browser before being stored locally, ensuring that no one—not even the server (if connected to one)—can read your notes without your password.

## Key Features

### 🔒 Client-Side Encryption
*   **AES Encryption:** All notes are encrypted using AES (Advanced Encryption Standard) with your password as the key.
*   **Zero Knowledge:** Your password never leaves your device in plain text. A hash is used for verification, but the actual encryption key is derived locally.
*   **Secure Storage:** Data is stored in your browser's LocalStorage in its encrypted form.

### ⚡ Quick Access Mode
*   **Mobile Friendly:** Set up a 4-digit PIN to encrypt your master password locally. 
*   **Fast Login:** Resume your session quickly on mobile devices without typing your long master password every time.

### 📝 Smart Note Taking
*   **Markdown Support:** Format your notes with bold, italics, lists, and code blocks.
*   **JSON Smart Copy:** Automatically detects JSON content and offers granular copying options (e.g., copy just the "password" field from a credential note).
*   **Voice Notes:** Record audio directly in the note.
*   **AI Transcription:** Uses Google Gemini 2.5 Flash to automatically transcribe your voice notes into text.
*   **AI Autocomplete:** Use the "AI Complete" magic wand to generate text or finish sentences based on context.

### 🎨 Modern UI/UX
*   **Dark Mode:** Built with a "dark-first" aesthetic, but supports light mode toggling.
*   **Masonry Layout:** Responsive grid layout for notes, similar to Google Keep.
*   **Mobile Optimized:** Swipeable sidebars, touch-friendly touch targets, and responsive modals.

## Getting Started

1.  **Create a Vault:** Enter a username and a strong password. This password generates your encryption key. **Do not lose it.**
2.  **Take Notes:** Click the + button to create a note.
3.  **Enable Quick Access:** After logging in, follow the prompt to set a PIN for easier access on subsequent visits.

## Technology Stack

*   **React 19**
*   **TypeScript**
*   **Tailwind CSS**
*   **Framer Motion** (Animations)
*   **CryptoJS** (Encryption)
*   **Phosphor Icons**
*   **Google Gemini API** (AI Features)
