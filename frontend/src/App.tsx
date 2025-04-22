// frontend/src/App.tsx
import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { FileList } from './components/FileList';
import { StorageStats } from './components/StorageStats';
import { Tab } from '@headlessui/react';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Abnormal Security - File Vault</h1>
          <p className="mt-1 text-sm text-gray-500">
            Secure file management system with deduplication and smart search
          </p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg">
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>

            <Tab.Group>
              <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
                <Tab
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                    ${selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600'}`
                  }
                >
                  Files
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                    ${selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600'}`
                  }
                >
                  Storage Statistics
                </Tab>
              </Tab.List>
              <Tab.Panels className="mt-2">
                <Tab.Panel>
                  <FileList key={refreshKey} />
                </Tab.Panel>
                <Tab.Panel>
                  <StorageStats />
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>
      </main>
      <footer className="bg-white shadow mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2024 Abnormal File Vault. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;