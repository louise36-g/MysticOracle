import React from 'react';

interface EditorLayoutProps {
  topBar: React.ReactNode;
  mainContent: React.ReactNode;
  sidebar?: React.ReactNode;
  error?: string | null;
}

const EditorLayout: React.FC<EditorLayoutProps> = ({
  topBar,
  mainContent,
  sidebar,
  error,
}) => {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top Bar */}
      {topBar}

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="flex">
        {/* Editor Area */}
        <div className="flex-1 p-4 lg:p-6 max-w-4xl">
          {mainContent}
        </div>

        {/* Sidebar */}
        {sidebar && (
          <div className="hidden lg:block w-80 border-l border-slate-800 bg-slate-900/50">
            <div className="sticky top-[57px] max-h-[calc(100vh-57px)] overflow-y-auto">
              {sidebar}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorLayout;
