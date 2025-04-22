// frontend/src/components/FileList.tsx
import React from 'react';
import { fileService } from '../services/fileService';
import { File as FileType } from '../types/file';
import { DocumentIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const FileList: React.FC = () => {
  const queryClient = useQueryClient();

  // Query for fetching files
  const { data: files, isLoading, error } = useQuery({
    queryKey: ['files'],
    queryFn: fileService.getFiles,
  });

  // Mutation for deleting files
  const deleteMutation = useMutation({
    mutationFn: fileService.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  // Mutation for downloading files
  const downloadMutation = useMutation({
    mutationFn: ({ fileUrl, filename }: { fileUrl: string; filename: string }) =>
      fileService.downloadFile(fileUrl, filename),
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleDownload = async (fileUrl: string, filename: string) => {
    try {
      await downloadMutation.mutateAsync({ fileUrl, filename });
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">Failed to load files. Please try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Files</h2>
      {!files || files.length === 0 ? (
        <div className="text-center py-12">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by uploading a file
          </p>
        </div>
      ) : (
        <div className="mt-6 flow-root">
          <ul className="-my-5 divide-y divide-gray-200">
            {files.map((file) => (
              <li key={file.id} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <DocumentIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.original_filename}
                    </p>
                    <p className="text-sm text-gray-500">
                      {file.file_type} • {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <p className="text-sm text-gray-500">
                      Uploaded {new Date(file.uploaded_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownload(file.file, file.original_filename)}
                      disabled={downloadMutation.isPending}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={deleteMutation.isPending}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 

// frontend/src/components/FileUpload.tsx
import React, { useState } from 'react';
import { fileService } from '../services/fileService';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface FileUploadProps {
  onUploadSuccess: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: fileService.uploadFile,
    onSuccess: () => {
      // Invalidate and refetch files query
      queryClient.invalidateQueries({ queryKey: ['files'] });
      setSelectedFile(null);
      onUploadSuccess();
    },
    onError: (error) => {
      setError('Failed to upload file. Please try again.');
      console.error('Upload error:', error);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    try {
      setError(null);
      await uploadMutation.mutateAsync(selectedFile);
    } catch (err) {
      // Error handling is done in onError callback
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-4">
        <CloudArrowUpIcon className="h-6 w-6 text-primary-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Upload File</h2>
      </div>
      <div className="mt-4 space-y-4">
        <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
          <div className="space-y-1 text-center">
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
              >
                <span>Upload a file</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileSelect}
                  disabled={uploadMutation.isPending}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">Any file up to 10MB</p>
          </div>
        </div>
        {selectedFile && (
          <div className="text-sm text-gray-600">
            Selected: {selectedFile.name}
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploadMutation.isPending}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            !selectedFile || uploadMutation.isPending
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
          }`}
        >
          {uploadMutation.isPending ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Uploading...
            </>
          ) : (
            'Upload'
          )}
        </button>
      </div>
    </div>
  );
}; 

// frontend/src/services/fileService.ts
import axios from 'axios';
import { File as FileType } from '../types/file';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const fileService = {
  async uploadFile(file: File): Promise<FileType> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/files/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getFiles(): Promise<FileType[]> {
    const response = await axios.get(`${API_URL}/files/`);
    return response.data;
  },

  async deleteFile(id: string): Promise<void> {
    await axios.delete(`${API_URL}/files/${id}/`);
  },

  async downloadFile(fileUrl: string, filename: string): Promise<void> {
    try {
      const response = await axios.get(fileUrl, {
        responseType: 'blob',
      });
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Failed to download file');
    }
  },
}; 

// frontend/src/types/file.ts

export interface File {
  id: string;
  original_filename: string;
  file_type: string;
  size: number;
  uploaded_at: string;
  file: string;
} 

// frontend/src/App.tsx

import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { FileList } from './components/FileList';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Abnormal Security - File Hub</h1>
          <p className="mt-1 text-sm text-gray-500">
            File management system
          </p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg">
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>
            <div className="bg-white shadow sm:rounded-lg">
              <FileList key={refreshKey} />
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-white shadow mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2024 File Hub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);

// frontend/src/react-app-env.d.ts
/// <reference types="react-scripts" /> 


FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy project files
COPY . .

# Build the application
RUN npm run build

# Install serve to run the application
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"] 

{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@heroicons/react": "^2.2.0",
    "@tanstack/react-query": "^5.66.6",
    "@tanstack/react-query-devtools": "^5.66.6",
    "@types/node": "^16.18.80",
    "axios": "^1.3.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.0.0",
    "react-scripts": "5.0.1",
    "typescript": "^4.9.5"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "@types/react": "^19.0.8",
    "@types/react-dom": "^19.0.3",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1"
  }
}


/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
} 
{
  "compilerOptions": {
    "target": "es5",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": [
    "src"
  ]
} 

// .gitignore

# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# Python / Django
__pycache__/
*.py[cod]
*.so
.Python
*.sqlite3
/backend/venv/
/backend/env/
/backend/media/
/backend/staticfiles/
.env
*.log

# Node / React
node_modules/
/frontend/build/
/frontend/.env
/frontend/.env.local
/frontend/coverage/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.idea/
.vscode/
*.swp
*.swo
.DS_Store

# Environment
.env*
!.env.example

# Environment files
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
*.log

# Testing
.coverage
htmlcov/
.pytest_cache/
/frontend/coverage/

# Distribution / packaging
dist/
build/
*.egg-info/

# Temporary files
*.bak
*.tmp
*~

#cursor files
.cursor
assessment.cursorrules
interview-context.md
base_project_requirements.md

// create_submission_zip.py

#!/usr/bin/env python3

import os
import zipfile
import pathspec
import datetime
from pathlib import Path
import sys

def get_current_user():
    """Get current user name safely."""
    try:
        return os.getenv('USER') or os.getlogin() or 'unknown_user'
    except Exception:
        return 'unknown_user'

def read_gitignore(gitignore_path):
    """Read and parse .gitignore file."""
    if not os.path.exists(gitignore_path):
        print("\n⚠️  WARNING: No .gitignore file found!")
        print("This might result in including unnecessary files like:")
        print("  - node_modules/")
        print("  - __pycache__/")
        print("  - .env files")
        print("  - IDE configuration files")
        print("  - Build directories")
        print("\nDo you want to continue without .gitignore? [y/N]: ", end='')
        response = input().lower()
        if response != 'y':
            print("Aborting. Please create a .gitignore file and try again.")
            sys.exit(1)
        return pathspec.PathSpec([])
    
    with open(gitignore_path, 'r') as f:
        gitignore_content = f.read()
    
    # Parse gitignore patterns
    spec = pathspec.PathSpec.from_lines(
        pathspec.patterns.GitWildMatchPattern,
        gitignore_content.splitlines()
    )
    return spec

def should_include_file(path, gitignore_spec):
    """Check if a file should be included based on gitignore rules."""
    try:
        # Convert to relative path more reliably
        abs_path = os.path.abspath(path)
        base_path = os.path.abspath('.')
        rel_path = os.path.relpath(abs_path, base_path)
        
        # Default patterns to exclude even without .gitignore
        default_excludes = [
            '__pycache__',
            'node_modules',
            '.env',
            '.git',
            '.idea',
            '.vscode',
            'venv',
            'env',
            'dist',
            'build',
            '*.pyc',
            '*.pyo',
            '*.pyd',
            '.DS_Store'
        ]
        
        # Check against default excludes
        for pattern in default_excludes:
            if pattern in rel_path:
                return False
        
        # Check if file matches any gitignore pattern
        return not gitignore_spec.match_file(rel_path)
    except Exception as e:
        print(f"Warning: Error processing path {path}: {e}")
        return False

def create_submission_zip(output_zip_name='submission.zip'):
    """Create a zip file containing all project files while respecting .gitignore."""
    # Read .gitignore
    gitignore_spec = read_gitignore('.gitignore')
    
    # Get current date and user for zip file
    current_date = datetime.datetime.now().strftime('%Y%m%d')
    current_user = get_current_user()
    zip_filename = f'{current_user}_{current_date}.zip'
    
    print(f"\nCreating submission zip: {zip_filename}")
    
    included_files = []
    total_size = 0
    
    # Create zip file
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk('.'):
            # Skip .git directory
            if '.git' in root:
                continue
                
            # Process each file
            for file in files:
                file_path = os.path.join(root, file)
                
                # Skip the zip file itself
                if file_path == f'./{zip_filename}':
                    continue
                
                # Check if file should be included
                if should_include_file(file_path, gitignore_spec):
                    try:
                        # Get file's timestamp and size
                        file_stat = os.stat(file_path)
                        file_size = file_stat.st_size / (1024 * 1024)  # Convert to MB
                        total_size += file_size
                        
                        # Get relative path for zip
                        rel_path = os.path.relpath(file_path, '.')
                        
                        # Create ZipInfo object to preserve timestamp
                        zinfo = zipfile.ZipInfo(
                            rel_path,
                            datetime.datetime.fromtimestamp(file_stat.st_mtime).timetuple()
                        )
                        
                        # Copy file contents and metadata
                        with open(file_path, 'rb') as f:
                            zipf.writestr(zinfo, f.read())
                        
                        included_files.append(f"{rel_path} ({file_size:.2f} MB)")
                    except Exception as e:
                        print(f"Warning: Error processing file {file_path}: {e}")
                        continue

    print("\nFiles included in the submission:")
    for file in included_files:
        print(f"✓ {file}")
    
    print(f"\nSubmission zip created successfully: {zip_filename}")
    print(f"Total Size: {total_size:.2f} MB")
    
    if total_size > 100:  # Warning if zip is larger than 100MB
        print("\n⚠️  WARNING: The zip file is quite large! Please verify its contents")
        print("    and make sure no unnecessary files were included.")

if __name__ == '__main__':
    create_submission_zip() 

    services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - backend_storage:/app/media
      - backend_static:/app/staticfiles
      - backend_data:/app/data
    environment:
      - DJANGO_DEBUG=True
      - DJANGO_SECRET_KEY=insecure-dev-only-key
    restart: always

  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000/api
    depends_on:
      - backend
    restart: always

volumes:
  backend_storage:
  backend_static:
  backend_data: 


  # Abnormal File Vault

A full-stack file management application built with React and Django, designed for efficient file handling and storage.

## 🚀 Technology Stack

### Backend
- Django 4.x (Python web framework)
- Django REST Framework (API development)
- SQLite (Development database)
- Gunicorn (WSGI HTTP Server)
- WhiteNoise (Static file serving)

### Frontend
- React 18 with TypeScript
- TanStack Query (React Query) for data fetching
- Axios for API communication
- Tailwind CSS for styling
- Heroicons for UI elements

### Infrastructure
- Docker and Docker Compose
- Local file storage with volume mounting

## 📋 Prerequisites

Before you begin, ensure you have installed:
- Docker (20.10.x or higher) and Docker Compose (2.x or higher)
- Node.js (18.x or higher) - for local development
- Python (3.9 or higher) - for local development

## 🛠️ Installation & Setup

### Using Docker (Recommended)

```bash
docker-compose up --build
```

### Local Development Setup

#### Backend Setup
1. **Create and activate virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Create necessary directories**
   ```bash
   mkdir -p media staticfiles data
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Start the development server**
   ```bash
   python manage.py runserver
   ```

#### Frontend Setup
1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Create environment file**
   Create `.env.local`:
   ```
   REACT_APP_API_URL=http://localhost:8000/api
   ```

3. **Start development server**
   ```bash
   npm start
   ```

## 🌐 Accessing the Application

- Frontend Application: http://localhost:3000
- Backend API: http://localhost:8000/api

## 📝 API Documentation

### File Management Endpoints

#### List Files
- **GET** `/api/files/`
- Returns a list of all uploaded files
- Response includes file metadata (name, size, type, upload date)

#### Upload File
- **POST** `/api/files/`
- Upload a new file
- Request: Multipart form data with 'file' field
- Returns: File metadata including ID and upload status

#### Get File Details
- **GET** `/api/files/<file_id>/`
- Retrieve details of a specific file
- Returns: Complete file metadata

#### Delete File
- **DELETE** `/api/files/<file_id>/`
- Remove a file from the system
- Returns: 204 No Content on success

#### Download File
- Access file directly through the file URL provided in metadata

## 🗄️ Project Structure

```
file-hub/
├── backend/                # Django backend
│   ├── files/             # Main application
│   │   ├── models.py      # Data models
│   │   ├── views.py       # API views
│   │   ├── urls.py        # URL routing
│   │   └── serializers.py # Data serialization
│   ├── core/              # Project settings
│   └── requirements.txt   # Python dependencies
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   └── package.json      # Node.js dependencies
└── docker-compose.yml    # Docker composition
```

## 🔧 Development Features

- Hot reloading for both frontend and backend
- React Query DevTools for debugging data fetching
- TypeScript for better development experience
- Tailwind CSS for rapid UI development

## 🐛 Troubleshooting

1. **Port Conflicts**
   ```bash
   # If ports 3000 or 8000 are in use, modify docker-compose.yml or use:
   # Frontend: npm start -- --port 3001
   # Backend: python manage.py runserver 8001
   ```

2. **File Upload Issues**
   - Maximum file size: 10MB
   - Ensure proper permissions on media directory
   - Check network tab for detailed error messages

3. **Database Issues**
   ```bash
   # Reset database
   rm backend/data/db.sqlite3
   python manage.py migrate
   ```

# Project Submission Instructions

## Preparing Your Submission

1. Before creating your submission zip file, ensure:
   - All features are implemented and working as expected
   - All tests are passing
   - The application runs successfully locally
   - Remove any unnecessary files or dependencies
   - Clean up any debug/console logs

2. Create the submission zip file:
   ```bash
   # Activate your backend virtual environment first
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Run the submission script from the project root
   cd ..
   python create_submission_zip.py
   ```

   The script will:
   - Create a zip file named `username_YYYYMMDD.zip` (e.g., `johndoe_20240224.zip`)
   - Respect .gitignore rules to exclude unnecessary files
   - Preserve file timestamps
   - Show you a list of included files and total size
   - Warn you if the zip is unusually large

3. Verify your submission zip file:
   - Extract the zip file to a new directory
   - Ensure all necessary files are included
   - Verify that no unnecessary files (like node_modules, __pycache__, etc.) are included
   - Test the application from the extracted files to ensure everything works

## Video Documentation Requirement

**Video Guidance** - Record a screen share demonstrating:
- How you leveraged Gen AI to help build the features
- Your prompting techniques and strategies
- Any challenges you faced and how you overcame them
- Your thought process in using AI effectively

**IMPORTANT**: Please do not provide a demo of the application functionality. Focus only on your Gen AI usage and approach.

## Submission Process

1. Submit your project through this Google Form:
   [Project Submission Form](https://forms.gle/nr6DZAX3nv6r7bru9)

2. The form will require:
   - Your project zip file (named `username_YYYYMMDD.zip`)
   - Your video documentation
   - Any additional notes or comments about your implementation

Make sure to test the zip file and video before submitting to ensure they are complete and working as expected.


# File Hub Frontend

React-based frontend for the File Hub application, built with TypeScript and modern web technologies.

## 🚀 Technology Stack

- React 18.x
- TypeScript 4.x
- React Router 6.x
- Axios for API communication
- Docker for containerization

## 📋 Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- Docker (if using containerized setup)

## 🛠️ Installation & Setup

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```
   Access the application at http://localhost:3000

### Docker Setup

```bash
# Build the image
docker build -t file-hub-frontend .

# Run the container
docker run -p 3000:3000 file-hub-frontend
```

## 📁 Project Structure

```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── services/      # API services
├── types/         # TypeScript types
└── utils/         # Utility functions
```

## 🔧 Available Scripts

- `npm start`: Start development server
- `npm run build`: Build for production
- `npm run test`: Run tests
- `npm run eject`: Eject from Create React App

## 🌐 API Integration

The frontend communicates with the backend API at `http://localhost:8000/api`. Key endpoints:

- `GET /api/files/`: List all files
- `POST /api/files/`: Upload new file
- `GET /api/files/<id>/`: Get file details
- `DELETE /api/files/<id>/`: Delete file

## 🔒 Environment Variables

```env
REACT_APP_API_URL=http://localhost:8000/api
```

## 🐛 Troubleshooting

1. **Build Issues**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules: `rm -rf node_modules && npm install`

2. **API Connection Issues**
   - Verify API URL in environment variables
   - Check CORS settings
   - Ensure backend is running

## 📚 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

# asgi.py
"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

application = get_asgi_application()

# settings.py
"""
Django settings for core project.

Generated by 'django-admin startproject' using Django 5.1.6.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-default-key-for-development')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DJANGO_DEBUG', 'True') == 'True'

ALLOWED_HOSTS = ['*']  # Configure appropriately in production


# Application definition

INSTALLED_APPS = [
  "django.contrib.admin",
  "django.contrib.auth",
  "django.contrib.contenttypes",
  "django.contrib.sessions",
  "django.contrib.messages",
  "django.contrib.staticfiles",
  "rest_framework",
  "corsheaders",
  "files",
]

MIDDLEWARE = [
  "django.middleware.security.SecurityMiddleware",
  "whitenoise.middleware.WhiteNoiseMiddleware",
  "django.contrib.sessions.middleware.SessionMiddleware",
  "corsheaders.middleware.CorsMiddleware",
  "django.middleware.common.CommonMiddleware",
  "django.middleware.csrf.CsrfViewMiddleware",
  "django.contrib.auth.middleware.AuthenticationMiddleware",
  "django.contrib.messages.middleware.MessageMiddleware",
  "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
  {
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [],
    "APP_DIRS": True,
    "OPTIONS": {
      "context_processors": [
        "django.template.context_processors.debug",
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
      ],
    },
  },
]

WSGI_APPLICATION = "core.wsgi.application"


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DATABASES = {
  "default": {
    "ENGINE": "django.db.backends.sqlite3",
    "NAME": os.path.join(BASE_DIR, 'data', 'db.sqlite3'),
  }
}


# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
  {
    "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
  },
  {
    "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
  },
  {
    "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
  },
  {
    "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
  },
]


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny'
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
}

# CORS settings
CORS_ALLOW_ALL_ORIGINS = True  # Configure appropriately in production
CORS_ALLOW_CREDENTIALS = True

# urls.py
"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('files.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# wsgi.py
"""
WSGI config for core project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

application = get_wsgi_application()

# apps.py
from django.apps import AppConfig


class FilesConfig(AppConfig):
  default_auto_field = "django.db.models.BigAutoField"
  name = "files"

# models.py
from django.db import models
import uuid
import os

def file_upload_path(instance, filename):
    """Generate file path for new file upload"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('uploads', filename)

class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to=file_upload_path)
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    size = models.BigIntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return self.original_filename

# serializers.py
from rest_framework import serializers
from .models import File

class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ['id', 'file', 'original_filename', 'file_type', 'size', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at'] 

# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FileViewSet

router = DefaultRouter()
router.register(r'files', FileViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 

# views.py
from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import File
from .serializers import FileSerializer

# Create your views here.

class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        data = {
            'file': file_obj,
            'original_filename': file_obj.name,
            'file_type': file_obj.content_type,
            'size': file_obj.size
        }
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Create necessary directories
RUN mkdir -p media staticfiles data

# Set permissions
RUN chmod -R 777 data media staticfiles

# Collect static files
RUN python manage.py collectstatic --noinput

# Make start script executable
COPY start.sh .
RUN chmod +x start.sh

EXPOSE 8000

CMD ["./start.sh"] 

# manage.py
#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
  """Run administrative tasks."""
  os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
  try:
    from django.core.management import execute_from_command_line
  except ImportError as exc:
    raise ImportError(
      "Couldn't import Django. Are you sure it's installed and "
      "available on your PYTHONPATH environment variable? Did you "
      "forget to activate a virtual environment?"
    ) from exc
  execute_from_command_line(sys.argv)


if __name__ == "__main__":
  main()

# requirements.txt
Django>=4.0,<5.0
djangorestframework>=3.14.0
django-cors-headers>=4.3.0
gunicorn>=21.2.0
python-dotenv>=1.0.0
whitenoise>=6.6.0
pathspec==0.11.2 


# start.sh
#!/bin/sh

# Ensure data directory exists and has proper permissions
mkdir -p /app/data
chmod -R 777 /app/data

# Run migrations
echo "Running migrations..."
python manage.py makemigrations
python manage.py migrate

# Start server
echo "Starting server..."
gunicorn --bind 0.0.0.0:8000 core.wsgi:application 


**Aarthi Balaraman** <abalaraman@abnormalsecurity.com>
Wed 16 Apr, 08:08 (3 days ago)
to me
Hi Hemant,
Thank you for your interest in Abnormal Security! We know your time is valuable, so we’ve designed this take-home challenge to be a **focused 2–4 hour commitment**, giving you an opportunity to showcase how you leverage **AI-augmented development tools** like **Cursor, Claude and Copilot** to build production-grade application features.
**The Challenge**
You’ll be working on **Abnormal File Vault**, a secure and efficient file hosting application. Using **React, Django, and Docker**, you will implement:
* **File Deduplication** – Optimizing storage efficiency by eliminating redundant files.
* **Search & Filtering** – Enabling users to efficiently retrieve files based on multiple attributes.
This challenge mirrors real-world engineering tasks, focusing on how you **use AI-assisted development** to improve efficiency, quality, and maintainability.
**Why Are We Doing This?**
At Abnormal Security, we believe the future of software development is **AI-augmented, scalable, and efficient**. This challenge allows you to:
**Demonstrate AI-augmented development** by integrating tools like Cursor, Claude, or Copilot into your workflow. **Showcase your ability to build production-ready software** with best practices in performance, maintainability, and scalability. **Work on engineering challenges** that reflects real-world product development.
**What Makes This Opportunity Exciting?**
**Be part of  AI-Augmented Development** – Showcase how you use AI tools to enhance productivity and software quality. **Work on a Mission that Matters** – Be part of a team building cutting-edge technology to **protect people from advanced cybersecurity threats**. **Gain Real-World Engineering Experience** – Tackle challenges that directly impact scalable, high-performance applications.
**Submission Process**
You’ll have **1 week** to complete the challenge after receiving this email. **During this time, we recommend setting aside a dedicated 2–4 hour block** where you can focus and complete the features in one go, rather than spreading the work over multiple sessions. This approach will allow you to simulate a real-world coding sprint, leverage AI-assisted development effectively, and deliver a more cohesive solution.
Submit your project via **Google Form** with the following:
**Your project ZIP file** (**named username_YYYYMMDD.zip**)
* Follow the instructions in the starter project’s README.md to run the script that creates the zip file for submission.
* **Test your ZIP file before submitting** to ensure it includes all necessary files.
**Your Video Documentation**
* Record a video (recommended 5-10 minutes) with a **short screen share** and your voice-over explanation of -
   * How you **leveraged AI tools **(Cursor, Claude, etc.) to assist in development
   * Your **prompting techniques** and **AI-assisted development workflow**
   * The **challenges you faced **and** how you overcame them**
***Important Note****: This video should NOT be a demo of the application. We are evaluating your AI-assisted development approach and process - please share via this video!*
**Any Additional Notes or Comments** about your implementation.
**How to Get Started and Complete Your Submission**
**Watch our introduction video** explaining the challenge and submission process. **Read this blog post** on AI-Powered Software Engineering for inspiration. **Review the detailed project requirements** for Abnormal File Vault. **Download the starter project** and begin implementing the required features. **Run the provided script** to package your submission as a ZIP file. **Submit your ZIP file and video via the Google Form** before the deadline.
We look forward to seeing your approach—**happy building!**
Best, Aarthi Abnormal Security

Abnormal File Vault – Product
Requirements
Overview
Abnormal File Vault is a file hosting application designed to optimize storage efficiency and
enhance file retrieval through deduplication and intelligent search capabilities. The project
consists of a React frontend and a Django backend, containerized using Docker for easy
setup and deployment.
A starter project will be provided as a ZIP file, containing the base structure for the frontend
and backend. Candidates are expected to extend and enhance this project to implement the
required functionality.
⏳ Time Expectation
This project is designed to be completed in approximately 2 – 4 hours.
📌 Business Case
As Abnormal Security continues to build AI-powered security solutions, efficient data storage
and retrieval are essential for managing files, reports, and forensic evidence related to
cybersecurity threats. A smart file management system like Abnormal File Vault could provide:
● Optimized Storage – Reducing redundancy through deduplication lowers storage costs
and improves performance.
● Faster Incident Investigations – A powerful search and filtering system enables
security teams to retrieve relevant files quickly.
● Scalability & Performance – Handling large datasets efficiently ensures seamless
operations as the system scales.
● Improved User Experience – A well-structured file system enhances usability for
internal teams and customers.
The ability to intelligently store, organize, and retrieve files aligns with Abnormal Security’s
mission to streamline and automate security workflows.
Technical Requirements
● Frontend: React
● Backend: Django/DRF
● Database: SQLite
● Containerization: Docker
Features & Functionality
Below two features are to be added to existing starter project to full fill the business need
1️⃣File Deduplication System
Objective: Optimize storage efficiency by detecting and handling duplicate file uploads.
Requirements:
● Identify duplicate files during upload
● Store references to existing files instead of saving duplicates
● Provide a way to track and display storage savings
2️⃣Search & Filtering System
Objective: Enable efficient retrieval of stored files through search and filtering options.
Requirements:
● Search files by filename
● Filter files by:
○ File type
○ Size range
○ Upload date
● Allow multiple filters to be applied simultaneously
● Optimize search performance for large datasets
Development Guidelines
● A starter project will be provided as a ZIP file, including the initial frontend and backend
setup
● Please follow through the README.md in the starter project for setup instructions
● Follow best practices for code organization, maintainability, and performance
● Optimize queries and indexing for efficient file searches
This document outlines the core functionality and business case for the project. The
implementation should focus on efficiency, scalability, and clean code, while adhering to the
given time constraints.

Now help me to complete this assignment as I dont have knowledge of python django and also i don't install the py on my machine so start from  basic and complete this assignment properly