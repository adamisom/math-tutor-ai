'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, X, Download, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { 
  ConversationSession,
  deleteConversationSession,
  exportConversationSession 
} from '../lib/conversation-history';
import { loadConversationHistoryHybrid } from '../lib/conversation-history-api';

interface ConversationHistoryProps {
  onSelectSession: (session: ConversationSession) => void;
  onClose: () => void;
}

export function ConversationHistory({ onSelectSession, onClose }: ConversationHistoryProps) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load conversations from database (if authenticated) or localStorage
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const history = await loadConversationHistoryHybrid(isAuthenticated);
        setSessions(history.sessions);
        console.log('[ConversationHistory] Loaded', history.sessions.length, 'conversations');
      } catch (error) {
        console.error('Failed to load conversation history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadHistory();
  }, [isAuthenticated]);
  
  const filteredSessions = sessions.filter(session => {
    return session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.problemText.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  const handleDelete = (sessionId: string) => {
    deleteConversationSession(sessionId);
    // Also delete from database if authenticated
    if (isAuthenticated) {
      fetch(`/api/conversations?id=${sessionId}`, {
        method: 'DELETE',
      }).catch(err => {
        console.warn('Failed to delete conversation from database:', err);
      });
    }
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };
  
  const handleClearAll = async () => {
    if (!confirm('Delete all conversations? This cannot be undone.')) {
      return;
    }
    
    // Delete all from localStorage
    sessions.forEach(session => {
      deleteConversationSession(session.id);
    });
    
    // Delete all from database if authenticated
    if (isAuthenticated) {
      try {
        await Promise.all(
          sessions.map(session =>
            fetch(`/api/conversations?id=${session.id}`, {
              method: 'DELETE',
            })
          )
        );
      } catch (error) {
        console.error('Failed to delete conversations from database:', error);
      }
    }
    
    setSessions([]);
  };
  
  const handleExport = (session: ConversationSession) => {
    const exportData = exportConversationSession(session);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${session.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Conversation History</h2>
          <div className="flex gap-2 items-center">
            {sessions.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded border border-red-200"
              >
                Clear All
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <p className="text-gray-500 text-center py-8">
              Loading conversations...
            </p>
          ) : filteredSessions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No conversations found
            </p>
          ) : (
            <div className="space-y-2">
              {filteredSessions.map(session => (
                <ConversationSessionCard
                  key={session.id}
                  session={session}
                  onSelect={() => onSelectSession(session)}
                  onDelete={() => handleDelete(session.id)}
                  onExport={() => handleExport(session)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationSessionCard({
  session,
  onSelect,
  onDelete,
  onExport,
}: {
  session: ConversationSession;
  onSelect: () => void;
  onDelete: () => void;
  onExport: () => void;
}) {
  const date = new Date(session.createdAt);
  
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={onSelect}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{session.title}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {session.problemText}
          </p>
        </div>
        <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onExport}
            className="p-1 hover:bg-gray-200 rounded"
            title="Export"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-red-100 rounded text-red-600"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {date.toLocaleDateString()}
        </span>
        {session.problemType && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
            {session.problemType}
          </span>
        )}
        {session.completed && (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
            Completed
          </span>
        )}
        {session.xpEarned > 0 && (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
            +{session.xpEarned} XP
          </span>
        )}
      </div>
    </div>
  );
}

