
import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../contexts/StoreContext';
import { ActionItem } from '../types';
import { Card, Button, Modal, Switch, Badge } from '../components/UI';
import { requestNotificationPermission } from '../services/notificationService';
import { 
  Sparkles, 
  ArrowRight, 
  BrainCircuit, 
  ListTodo, 
  ShoppingBag, 
  BookOpen, 
  Sunrise, 
  Loader2, 
  RotateCw,
  Settings,
  Bell,
  Trash2,
  FileText,
  Mic,
  ExternalLink,
  Wand2,
  Copy,
  Check,
  Calendar,
  ChevronRight,
  Lightbulb,
  Download,
  Upload,
  Database
} from 'lucide-react';

interface DashboardProps {
  onNewMemory: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNewMemory }) => {
  const { 
    profile, 
    recommendations, 
    memories, 
    dailyBriefing, 
    refreshDailyBriefing, 
    deleteMemory, 
    toggleSetting, 
    executeAiAction,
    toggleBriefingAction,
    exportData,
    importData
  } = useStore();
  
  const [generatingBriefing, setGeneratingBriefing] = useState(false);
  
  // Modal States
  const [showSettings, setShowSettings] = useState(false);
  const [showMemoryLog, setShowMemoryLog] = useState(false);
  
  // AI Action States
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [currentAction, setCurrentAction] = useState<ActionItem | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkBriefing = async () => {
      // If we have memories but no briefing for today, try to generate one
      if (profile && !dailyBriefing && memories.length > 0 && !generatingBriefing) {
        setGeneratingBriefing(true);
        await refreshDailyBriefing();
        setGeneratingBriefing(false);
      }
    };
    checkBriefing();
  }, [profile, dailyBriefing, memories]);

  const handleRefreshBriefing = async () => {
    setGeneratingBriefing(true);
    await refreshDailyBriefing(true);
    setGeneratingBriefing(false);
  };

  const handleEnablePush = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        toggleSetting('pushNotifications', true);
      } else {
        alert("Please allow notifications in your browser settings first.");
        toggleSetting('pushNotifications', false);
      }
    } else {
      toggleSetting('pushNotifications', false);
    }
  };

  const handleAiAction = async (action: ActionItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling the task checkbox
    setCurrentAction(action);
    setIsProcessingAction(true);
    try {
      const result = await executeAiAction(action);
      setAiResult(result);
    } catch (e) {
      setAiResult("Sorry, I couldn't complete that task right now.");
    }
    setIsProcessingAction(false);
  };
  
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if(confirm("This will replace your current data with the backup. Continue?")) {
        const success = await importData(e.target.files[0]);
        if (!success) alert("Failed to import backup. Please check the file.");
      }
    }
  };

  const copyToClipboard = () => {
    if (aiResult) {
      navigator.clipboard.writeText(aiResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getIconForRec = (type: string) => {
    switch (type) {
      case 'product': return ShoppingBag;
      case 'action': return ListTodo;
      case 'resource': return BookOpen;
      default: return BrainCircuit;
    }
  };

  if (!profile) return <Loader2 className="animate-spin" />;

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {profile.name.split(' ')[0]}.</h1>
          <p className="text-gray-500 mt-2 text-lg">Your intelligent overview is ready.</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <Button variant="ghost" onClick={() => setShowMemoryLog(true)} className="text-gray-500">
            Manage Memories
          </Button>
          <Button variant="ghost" onClick={() => setShowSettings(true)} title="Settings" className="text-gray-500">
            <Settings className="w-5 h-5" />
          </Button>
          <Button variant="secondary" onClick={onNewMemory} icon={Sparkles} className="shadow-sm hover:shadow-md transition-shadow">
            Add Memory
          </Button>
        </div>
      </div>

      {/* Daily Briefing Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Sunrise className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Today's Briefing</h2>
                <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {currentDate}
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleRefreshBriefing} disabled={generatingBriefing} className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-gray-50 hover:bg-gray-100">
               {generatingBriefing ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <RotateCw className="w-4 h-4 text-gray-600" />}
            </Button>
          </div>

          {generatingBriefing ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-white p-3 rounded-full shadow-sm border border-blue-100">
                  <BrainCircuit className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">Synthesizing insights...</h3>
              <p className="text-gray-500 mt-2 max-w-sm mx-auto">Analyzing recent memories to generate your personalized action plan.</p>
            </div>
          ) : dailyBriefing ? (
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Column 1: Insights */}
              <div className="lg:col-span-1 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" /> Key Insights
                  </h3>
                  {dailyBriefing.recap.length > 0 ? (
                    <div className="space-y-4">
                      {dailyBriefing.recap.map((item, i) => (
                        <div key={i} className="flex gap-4 group">
                          <div className="flex-shrink-0 w-1 bg-gray-200 rounded-full group-hover:bg-blue-400 transition-colors h-auto min-h-[1.5rem]" />
                          <p className="text-gray-700 leading-relaxed text-sm">{item}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No major insights derived today.</p>
                  )}
                </div>

                {/* Top Picks small view */}
                <div className="pt-6 border-t border-gray-100">
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Suggestions
                  </h3>
                   <div className="space-y-3">
                      {dailyBriefing.topRecommendations.map((rec, i) => (
                        <a key={i} href={rec.link} target="_blank" rel="noreferrer" className="block group">
                          <div className="bg-gray-50 rounded-xl p-4 hover:bg-blue-50 transition-colors border border-gray-100 hover:border-blue-100 group-hover:shadow-sm">
                             <div className="flex items-center gap-2 mb-1">
                                <Badge color="blue">{rec.type}</Badge>
                                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                             </div>
                             <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{rec.title}</p>
                             <p className="text-xs text-gray-500 mt-1 line-clamp-2">{rec.reasoning}</p>
                          </div>
                        </a>
                      ))}
                   </div>
                </div>
              </div>

              {/* Column 2 & 3: Action Plan */}
              <div className="lg:col-span-2 bg-gray-50/50 rounded-xl border border-gray-100 p-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ListTodo className="w-4 h-4" /> Action Plan
                </h3>
                
                {dailyBriefing.pendingActions.length > 0 ? (
                  <div className="space-y-3">
                    {dailyBriefing.pendingActions.map((action, i) => {
                      const isCompleted = action.status === 'completed';
                      return (
                        <div 
                          key={action.id} 
                          className={`
                            group relative bg-white rounded-xl border transition-all duration-200 overflow-hidden
                            ${isCompleted 
                              ? 'border-gray-100 opacity-60' 
                              : 'border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 hover:scale-[1.01]'
                            }
                          `}
                        >
                          <div className="p-4 flex flex-col sm:flex-row gap-4">
                            {/* Checkbox & Content */}
                            <div className="flex-1 flex gap-4 cursor-pointer" onClick={() => toggleBriefingAction(action.id)}>
                              <div className={`
                                w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors mt-0.5
                                ${isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300 group-hover:border-blue-400'}
                              `}>
                                {isCompleted && <Check className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <div>
                                <h4 className={`text-sm font-medium transition-all ${isCompleted ? 'text-gray-500 line-through decoration-gray-300' : 'text-gray-900'}`}>
                                  {action.label}
                                </h4>
                                {!isCompleted && action.aiActionType && (
                                  <p className="text-xs text-blue-600 mt-1 font-medium">
                                    AI can help: {action.aiActionLabel}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* AI Action Button */}
                            {!isCompleted && action.aiActionType && (
                              <div className="flex-shrink-0 pt-2 sm:pt-0 pl-10 sm:pl-0">
                                <button
                                  onClick={(e) => handleAiAction(action, e)}
                                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold uppercase tracking-wide rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow active:scale-95"
                                >
                                  <Wand2 className="w-3 h-3" />
                                  <span>{action.aiActionLabel || "Run AI Agent"}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center bg-white rounded-xl border border-gray-100 border-dashed">
                    <Check className="w-8 h-8 text-green-500 mb-2" />
                    <p className="text-gray-900 font-medium">All caught up!</p>
                    <p className="text-sm text-gray-500">No pending actions for today.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
             // Empty State within Briefing
             <div className="bg-gray-50 rounded-xl p-12 border border-gray-100 border-dashed flex flex-col items-center justify-center text-center">
                <Sparkles className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-gray-900 font-medium text-lg">Your briefing is waiting for data.</p>
                <p className="text-gray-500 text-sm mb-6 max-w-sm">Add your first memory (text, file, or audio) to generate personalized daily insights.</p>
                <Button onClick={onNewMemory} variant="secondary" icon={ArrowRight}>Create First Memory</Button>
             </div>
          )}
        </div>
      </div>

      {/* Past Recommendations Grid */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Explore More</h2>
        </div>
        
        {recommendations.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((rec) => {
              const Icon = getIconForRec(rec.type);
              return (
                <Card key={rec.id} className="group p-6 flex flex-col h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-gray-100 transition-colors">
                      <Icon className="w-5 h-5 text-gray-700" />
                    </div>
                    <Badge>{rec.type}</Badge>
                  </div>
                  
                  <h3 className="font-bold text-gray-900 mb-2 text-lg leading-tight">{rec.title}</h3>
                  <p className="text-sm text-gray-600 mb-6 flex-1 leading-relaxed">
                    {rec.description}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 italic mb-3 line-clamp-1">
                      Why: {rec.reasoning}
                    </p>
                    {rec.link && (
                      <a href={rec.link} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all group-hover:shadow-sm">
                        Open Resource <ChevronRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400">Recommendations will appear here as your profile grows.</p>
          </div>
        )}
      </div>

      {/* AI Action Result Modal */}
      <Modal isOpen={!!aiResult || isProcessingAction} onClose={() => setAiResult(null)} title={currentAction?.aiActionLabel || "AI Assistance"}>
        {isProcessingAction ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-900">Working on it...</p>
            <p className="text-sm text-gray-500">I'm drafting that for you now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-sm text-gray-800 whitespace-pre-wrap max-h-[60vh] overflow-y-auto font-mono leading-relaxed shadow-inner">
              {aiResult}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setAiResult(null)}>Close</Button>
              <Button variant="primary" onClick={copyToClipboard} icon={copied ? Check : Copy}>
                {copied ? "Copied" : "Copy to Clipboard"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings">
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
              <Database className="w-4 h-4" /> Data Management
            </h3>
            <p className="text-sm text-gray-500 mb-4">
               Since your data is stored securely on your device, use this to move data between devices or browsers.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={exportData} icon={Download} className="w-full">
                Export Backup
              </Button>
              <div className="w-full">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImport} 
                  accept=".json" 
                  className="hidden" 
                />
                <Button 
                  variant="secondary" 
                  onClick={() => fileInputRef.current?.click()} 
                  icon={Upload} 
                  className="w-full"
                >
                  Import Backup
                </Button>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-100">
            <h3 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
              <Bell className="w-4 h-4" /> Notifications
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Daily briefings are generated and sent at 7:00 PM MST.
            </p>
            <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
               <Switch 
                 label="Push Notifications" 
                 checked={!!profile?.settings?.pushNotifications} 
                 onChange={handleEnablePush}
               />
               <Switch 
                 label="Email Notifications" 
                 checked={!!profile?.settings?.emailNotifications} 
                 onChange={(val) => toggleSetting('emailNotifications', val)}
               />
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-medium text-gray-900 mb-2">Account</h3>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
               <p className="text-sm text-gray-500">Signed in as <span className="text-gray-900 font-medium">{profile.name}</span></p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Memory Log Modal */}
      <Modal isOpen={showMemoryLog} onClose={() => setShowMemoryLog(false)} title="Memory Log">
         <div className="space-y-1">
           <p className="text-sm text-gray-500 mb-4">
             These inputs shape your Daily Briefing. Deleting an item removes it from future analysis.
           </p>
           {memories.length > 0 ? (
             <div className="space-y-3">
               {memories.map((mem) => (
                 <div key={mem.id} className="flex items-start gap-3 p-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors group">
                   <div className="mt-1 text-gray-400 p-2 bg-gray-100 rounded-md">
                     {mem.type === 'audio' ? <Mic className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                   </div>
                   <div className="flex-1 min-w-0 py-1">
                     <p className="text-sm text-gray-900 font-medium truncate">
                       {mem.originalFileName || mem.content.substring(0, 40) + (mem.content.length > 40 ? '...' : '')}
                     </p>
                     <div className="flex items-center gap-2 mt-1">
                       <span className="text-xs text-gray-400">{new Date(mem.createdAt).toLocaleDateString()}</span>
                       <div className="flex gap-1 overflow-hidden">
                         {mem.insights.slice(0,2).map((tag, i) => (
                           <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-500 whitespace-nowrap">{tag}</span>
                         ))}
                       </div>
                     </div>
                   </div>
                   <button 
                    onClick={() => {
                      if(confirm('Delete this memory? It will be removed from future AI analysis.')) {
                        deleteMemory(mem.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete Memory"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">No memories recorded yet.</div>
           )}
         </div>
      </Modal>

    </div>
  );
};
