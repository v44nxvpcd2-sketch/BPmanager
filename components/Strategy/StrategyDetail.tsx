
import React from 'react';
import { X, Target, Save, Percent } from 'lucide-react';
import { Project } from '../../types';
import { RADIUS_CLASS } from '../../constants';

interface StrategyDetailProps {
  projects: Project[];
  title: string;
  onUpdateTitle: (title: string) => void;
  onUpdateProjectWeight: (id: string, weight: number) => void;
  onClose: () => void;
}

const StrategyDetail: React.FC<StrategyDetailProps> = ({ projects, title, onUpdateTitle, onUpdateProjectWeight, onClose }) => {
  const totalWeight = projects.reduce((acc, p) => acc + (p.weight || 1), 0);

  return (
    <div className={`fixed left-0 top-0 h-full w-[480px] bg-white z-[60] shadow-[40px_0_100px_rgba(0,0,0,0.1)] flex flex-col border-r border-gray-100 animate-in slide-in-from-left-10 duration-500`}>
      <div className="p-10 pb-6 border-b border-gray-100 flex items-start justify-between">
        <div className="flex-1 mr-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[9px] font-black bg-black text-[#eaff00] px-3 py-1.5 rounded-lg uppercase tracking-[0.2em]">Strategy Hub</span>
          </div>
          <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Annual Theme</label>
          <input 
            className="text-3xl font-black bg-transparent border-b-2 border-transparent hover:border-gray-100 focus:border-black transition-colors w-full focus:outline-none tracking-tight text-black placeholder:text-gray-200 pb-2" 
            value={title} 
            onChange={e => onUpdateTitle(e.target.value)} 
          />
        </div>
        <button onClick={onClose} className="p-3 bg-gray-50 hover:bg-black hover:text-[#eaff00] rounded-xl text-gray-400 transition-all"><X size={24}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
        <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100">
           <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Strategic Weighting</h4>
           <p className="text-[10px] text-gray-500 mb-6 leading-relaxed">
             Adjust the influence of each main business line on the overall yearly performance. Higher weight means that project's KPIs have more impact on the central score.
           </p>
           
           <div className="space-y-6">
             {projects.map(p => {
               const percentage = totalWeight > 0 ? Math.round(((p.weight || 1) / totalWeight) * 100) : 0;
               return (
                 <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                       <span className="font-bold text-sm text-black truncate w-40" title={p.name}>{p.name}</span>
                       <span className="text-xs font-black bg-[#eaff00] text-black px-2 py-0.5 rounded">{percentage}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <input 
                         type="range" 
                         min="1" 
                         max="100" 
                         value={p.weight || 1} 
                         onChange={(e) => onUpdateProjectWeight(p.id, parseInt(e.target.value))}
                         className="flex-1 h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-black"
                       />
                       <span className="text-[10px] font-bold text-gray-300 w-8 text-right">{p.weight || 1} pts</span>
                    </div>
                 </div>
               );
             })}
           </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyDetail;
