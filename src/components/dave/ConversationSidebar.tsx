import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Plus, Trash2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SavedConversation {
  id: string;
  title: string;
  messages: unknown[];
  lastUpdated: Date;
}

interface ConversationSidebarProps {
  currentConversationId: string;
  conversations: SavedConversation[];
  onLoadConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export function ConversationSidebar({
  currentConversationId,
  conversations,
  onLoadConversation,
  onNewConversation,
  onDeleteConversation,
}: ConversationSidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 p-3">
        <Button
          onClick={onNewConversation}
          variant="outline"
          className="w-full justify-start gap-2 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
              <MessageSquare className="mb-2 h-8 w-8 opacity-50" />
              <span className="text-sm">No saved conversations</span>
            </div>
          )}

          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex cursor-pointer items-start justify-between rounded-sm p-2.5 transition-colors duration-200 ${
                conv.id === currentConversationId
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
              onClick={() => onLoadConversation(conv.id)}
            >
              <div className="flex min-w-0 flex-1 gap-2">
                <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{conv.title}</p>
                  <p className="flex items-center gap-1 text-xs text-zinc-500">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(conv.lastUpdated), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conv.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-zinc-500 hover:text-red-400" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
