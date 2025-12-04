import React from 'react';
import { useStore } from '../contexts/StoreContext';
import { Card, Badge, Button } from '../components/UI';
import { User, Target, ShieldAlert, Lightbulb, Trash2, Database, MapPin } from 'lucide-react';

export const Profile: React.FC = () => {
  const { profile, clearData } = useStore();

  if (!profile) return null;

  const Section = ({ title, icon: Icon, items, color = 'gray' }: { title: string, icon: any, items: string[], color?: 'gray'|'blue'|'green'|'orange' }) => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{title}</h3>
      </div>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, idx) => (
            <Badge key={idx} color={color}>{item}</Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">No data yet.</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Continuum Profile</h1>
          <div className="flex items-center gap-2 text-gray-500 mt-1">
            <MapPin className="w-3 h-3" />
            <span className="text-sm">{profile.location || 'Location Unknown'}</span>
            <span className="text-gray-300">•</span>
            <span className="text-sm">Last updated {new Date(profile.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>
        <Button variant="secondary" onClick={() => {
          if(confirm("Are you sure? This will wipe your memory history.")) clearData();
        }} icon={Trash2}>
          Reset Memory
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Summary Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="font-medium text-gray-900 mb-4">Executive Summary</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <p className="text-gray-700 leading-relaxed">
                {profile.summary}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <Section title="Active Goals" icon={Target} items={profile.goals} color="green" />
            <hr className="my-6 border-gray-100" />
            <Section title="Known Interests" icon={Lightbulb} items={profile.interests} color="blue" />
            <hr className="my-6 border-gray-100" />
            <Section title="Concerns & Constraints" icon={ShieldAlert} items={profile.concerns} color="orange" />
          </Card>
        </div>

        {/* Facts Sidebar */}
        <div className="space-y-6">
           <Card className="p-6 h-full">
             <div className="flex items-center gap-2 mb-4">
               <Database className="w-4 h-4 text-gray-400" />
               <h3 className="font-medium text-gray-900">Key Facts</h3>
             </div>
             <ul className="space-y-3">
               {profile.keyFacts.map((fact, i) => (
                 <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                   <span className="block w-1.5 h-1.5 mt-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                   {fact}
                 </li>
               ))}
               {profile.keyFacts.length === 0 && (
                 <li className="text-sm text-gray-400 italic">No specific facts extracted yet.</li>
               )}
             </ul>
           </Card>
        </div>
      </div>
    </div>
  );
};