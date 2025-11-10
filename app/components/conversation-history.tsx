'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, X, Download, Trash2 } from 'lucide-react';
import { 
  loadConversationHistory, 
  ConversationSession,
  deleteConversationSession,
  exportConversationSession 
} from '../lib/conversation-history';

interface ConversationHistoryProps {
  onSelectSession: (session: ConversationSession) => void;
  onClose: () => void;
}

export function ConversationHistory({ onSelectSession, onClose }: ConversationHistoryProps) {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  useEffect(() => {
    const history = loadConversationHistory();
    setSessions(history.sessions);
  }, []);
  
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.problemText.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterType === 'all' || session.problemType === filterType;
    
    return matchesSearch && matchesFilter;
  });
  
  const handleDelete = (sessionId: string) => {
    if (confirm('Delete this conversation?')) {
      deleteConversationSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    }
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
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b space-y-2">
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
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="all">All Types</option>
            <option value="Algebra">Algebra</option>
            <option value="Geometry">Geometry</option>
            <option value="Word Problem">Word Problem</option>
            <option value="Fractions">Fractions</option>
            <option value="Calculus">Calculus</option>
          </select>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {filteredSessions.length === 0 ? (
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

