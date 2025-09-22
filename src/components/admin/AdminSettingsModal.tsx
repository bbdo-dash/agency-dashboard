"use client";

import { useState, useRef, useEffect } from "react";
import EventEditor from "./EventEditor";
import RSSFeedManager from "./RSSFeedManager";
import SlideshowManager from "./SlideshowManager";

export default function AdminSettingsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'appearance' | 'events' | 'news' | 'slideshow'>('appearance');
  const [showEventEditor, setShowEventEditor] = useState(false);
  const [showRSSManager, setShowRSSManager] = useState(false);
  const [showSlideshowManager, setShowSlideshowManager] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Dark mode settings
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  // Event settings
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // RSS settings
  const [rssUrl, setRssUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Load settings on mount
  useEffect(() => {
    const darkMode = localStorage.getItem("darkMode");
    if (darkMode === null) {
      // Default to light mode if no preference is saved
      setDarkModeEnabled(false);
      localStorage.setItem("darkMode", "false");
    } else {
      setDarkModeEnabled(darkMode === "true");
    }
  }, []);

  // Modal can only be closed by clicking the X button

  const handleDarkModeToggle = () => {
    const newDarkMode = !darkModeEnabled;
    setDarkModeEnabled(newDarkMode);
    localStorage.setItem("darkMode", String(newDarkMode));
    
    // Apply dark mode immediately
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };


  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('csvFile', selectedFile);

      const response = await fetch('/api/admin/upload-events', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Events erfolgreich aktualisiert! ${result.eventCount} Events wurden geladen.`);
        setSelectedFile(null);
        
        // Force refresh the dashboard data
        try {
          await fetch('/api/dashboard?refresh=true', { cache: 'no-store' });
          // Trigger page reload to show updated events
          window.location.reload();
        } catch (error) {
          console.error('Error refreshing dashboard:', error);
          // Still reload the page even if refresh fails
          window.location.reload();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      alert(`Fehler beim Hochladen der Datei: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRssAnalysis = async () => {
    if (!rssUrl.trim()) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/admin/analyze-rss', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: rssUrl }),
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysisResult(result);
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing RSS feed:', error);
      alert('Fehler bei der RSS-Feed Analyse. Bitte überprüfen Sie die URL.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      {/* Settings Gear Icon Button with Text */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all relative z-[9998]"
        aria-label="Einstellungen öffnen"
        title="Admin Einstellungen"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-gray-600 dark:text-gray-400"
        >
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Einstellungen
        </span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div 
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden z-[10000]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Admin Einstellungen
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('appearance')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'appearance'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Erscheinungsbild
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'events'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Event Kalender
              </button>
              <button
                onClick={() => setActiveTab('news')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'news'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                RSS Feeds
              </button>
              <button
                onClick={() => setActiveTab('slideshow')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'slideshow'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Slideshow
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto max-h-96">
              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Dark Mode Einstellungen
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Dark Mode aktiviert
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Aktiviert oder deaktiviert den dunklen Modus
                          </p>
                        </div>
                        <button
                          onClick={handleDarkModeToggle}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            darkModeEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              darkModeEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Events Tab */}
              {activeTab === 'events' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Event Kalender Verwaltung
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          CSV-Datei hochladen
                        </label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                          <input
                            type="file"
                            accept=".csv"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-gray-500 dark:text-gray-400
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-full file:border-0
                              file:text-sm file:font-semibold
                              file:bg-blue-50 file:text-blue-700
                              hover:file:bg-blue-100"
                          />
                          {selectedFile && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              Ausgewählte Datei: {selectedFile.name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={handleFileUpload}
                          disabled={!selectedFile || isUploading}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          {isUploading ? 'Wird hochgeladen...' : 'Events aktualisieren'}
                        </button>
                        
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                          <button
                            onClick={() => setShowEventEditor(true)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                          >
                            📝 Events manuell bearbeiten
                          </button>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                            Events einzeln hinzufügen, bearbeiten oder löschen
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* News Tab */}
              {activeTab === 'news' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      RSS Feed Verwaltung
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          RSS Feed URL
                        </label>
                        <input
                          type="url"
                          value={rssUrl}
                          onChange={(e) => setRssUrl(e.target.value)}
                          placeholder="https://example.com/feed.xml"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <button
                        onClick={handleRssAnalysis}
                        disabled={!rssUrl.trim() || isAnalyzing}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        {isAnalyzing ? 'Wird analysiert...' : 'RSS Feed analysieren'}
                      </button>

                      {analysisResult && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                            📊 RSS-Feed Analyseergebnis
                          </h4>
                          
                          {/* Feed Info */}
                          <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded border">
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Feed-Informationen</h5>
                            <div className="space-y-1 text-sm">
                              <p><strong>Titel:</strong> {analysisResult.feedInfo.title}</p>
                              <p><strong>Beschreibung:</strong> {analysisResult.feedInfo.description}</p>
                              <p><strong>Artikel-Anzahl:</strong> {analysisResult.feedInfo.itemCount}</p>
                              <p><strong>Sprache:</strong> {analysisResult.feedInfo.language}</p>
                              <p><strong>Letztes Update:</strong> {analysisResult.feedInfo.lastBuildDate}</p>
                            </div>
                          </div>
                          
                          {/* Recommendations */}
                          <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Bewertung & Empfehlungen</h5>
                            <div className="space-y-2 text-sm">
                              {analysisResult.recommendations.map((rec: string, index: number) => (
                                <div 
                                  key={index} 
                                  className={`p-2 rounded ${
                                    rec.includes('✅') ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' :
                                    rec.includes('❌') ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200' :
                                    rec.includes('⚠️') ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200' :
                                    rec.includes('ℹ️') ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200' :
                                    rec.includes('---') ? 'border-t border-gray-300 dark:border-gray-600 my-2' :
                                    rec.includes('**') ? 'font-bold text-lg' :
                                    'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                  }`}
                                  dangerouslySetInnerHTML={{ 
                                    __html: rec.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                        <button
                          onClick={() => setShowRSSManager(true)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          📝 RSS-Feeds verwalten
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                          RSS-Feeds hinzufügen, bearbeiten oder entfernen
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Slideshow Tab */}
              {activeTab === 'slideshow' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Slideshow Verwaltung
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            📁 Ordner hochladen
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Ersetzt alle aktuellen Slideshow-Bilder
                          </p>
                          <button
                            onClick={() => setShowSlideshowManager(true)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                          >
                            Ordner hochladen
                          </button>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            🖼️ Slideshow verwalten
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Reihenfolge ändern, Bilder löschen, neue hinzufügen
                          </p>
                          <button
                            onClick={() => setShowSlideshowManager(true)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                          >
                            Slideshow bearbeiten
                          </button>
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h5 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                          💡 Unterstützte Formate
                        </h5>
                        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                          <li>• PNG-Dateien (.png)</li>
                          <li>• JPEG-Dateien (.jpg, .jpeg)</li>
                          <li>• Einzelne Dateien oder ganze Ordner</li>
                          <li>• Drag & Drop zum Ändern der Reihenfolge</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event Editor Modal */}
      {showEventEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl mx-4 max-h-[95vh] overflow-hidden">
            <div className="p-4">
              <EventEditor onClose={() => setShowEventEditor(false)} />
            </div>
          </div>
        </div>
      )}

      {/* RSS Feed Manager Modal */}
      {showRSSManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10002]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[95vh] overflow-hidden">
            <div className="p-6">
              <RSSFeedManager onClose={() => setShowRSSManager(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Slideshow Manager Modal */}
      {showSlideshowManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10003]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl mx-4 max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
              <SlideshowManager onClose={() => setShowSlideshowManager(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
