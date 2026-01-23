
import React, { useState, useMemo, useRef } from 'react';
import { X, TrendingUp, TrendingDown, Users, Building2, PieChart, Plus, Trash2, DollarSign, Wallet, Download, Upload } from 'lucide-react';
import { Project, Member, TransactionType, Transaction, Quarter } from '../../types';
import { RADIUS_CLASS } from '../../constants';
import * as XLSX from 'xlsx';

interface FinanceDashboardProps {
  projects: Project[];
  members: Member[];
  onClose: () => void;
  // Strict string type matching App.tsx and ProjectDetail.tsx now
  onUpdateQuarter: (pid: string, qid: string, field: keyof Quarter, val: any) => void;
  onSaveProjects: (newProjects: Project[]) => void;
}

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ projects, members, onClose, onUpdateQuarter, onSaveProjects }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'manage'>('overview');
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>("q1");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New Transaction State
  const [newTransType, setNewTransType] = useState<TransactionType>('expense');
  const [newTransAmount, setNewTransAmount] = useState<string>('');
  const [newTransDesc, setNewTransDesc] = useState<string>('');
  const [newTransDate, setNewTransDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTransMember, setNewTransMember] = useState<string>('');

  // Recursive function to gather all projects including subprojects
  const getAllProjects = (list: Project[]): Project[] => {
    return list.flatMap(p => [p, ...(p.subProjects ? getAllProjects(p.subProjects) : [])]);
  };
  const allProjects = useMemo(() => getAllProjects(projects), [projects]);

  // Calculations
  const stats = useMemo(() => {
    let income = 0, expense = 0, salary = 0, tax = 0;
    
    allProjects.forEach(p => {
      (['q1', 'q2', 'q3', 'q4'] as const).forEach(qid => {
        const q = p.quarters[qid];
        if (q.transactions) {
          q.transactions.forEach(t => {
            const amt = Number(t.amount) || 0;
            if (t.type === 'income') income += amt;
            else if (t.type === 'expense') expense += amt;
            else if (t.type === 'salary') salary += amt;
            else if (t.type === 'tax') tax += amt;
          });
        }
      });
    });

    const totalCost = expense + salary + tax;
    const profit = income - totalCost;
    return { income, expense, salary, tax, totalCost, profit };
  }, [allProjects]);

  const handleAddTransaction = () => {
    if (!selectedProjectId || !newTransAmount || !newTransDesc) return;
    
    const targetProject = allProjects.find(p => p.id === selectedProjectId);
    if (!targetProject) return;

    // Use string type for qid as required by prop
    const qKey = selectedQuarterId as keyof Project['quarters'];
    const q = targetProject.quarters[qKey];
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: newTransType,
      amount: parseFloat(newTransAmount),
      description: newTransDesc,
      date: newTransDate,
      memberId: newTransType === 'salary' ? newTransMember : undefined
    };

    const updatedTransactions = [...(q.transactions || []), newTransaction];
    onUpdateQuarter(selectedProjectId, selectedQuarterId, 'transactions', updatedTransactions);

    // Reset form partially
    setNewTransAmount('');
    setNewTransDesc('');
  };

  const handleDeleteTransaction = (pid: string, qid: string, tid: string) => {
     const targetProject = allProjects.find(p => p.id === pid);
     if (!targetProject) return;
     const qKey = qid as keyof Project['quarters'];
     const q = targetProject.quarters[qKey];
     const updatedTransactions = (q.transactions || []).filter(t => t.id !== tid);
     onUpdateQuarter(pid, qid, 'transactions', updatedTransactions);
  };

  const handleExportExcel = () => {
    const rows: any[] = [];
    allProjects.forEach(p => {
      (['q1', 'q2', 'q3', 'q4'] as const).forEach(qid => {
        const q = p.quarters[qid];
        if (q.transactions) {
          q.transactions.forEach(t => {
             const memberName = t.memberId ? members.find(m => m.id === t.memberId)?.name || '' : '';
             rows.push({
               'Project ID': p.id,
               'Project Name': p.name,
               'Quarter': qid,
               'Type': t.type,
               'Amount': t.amount,
               'Description': t.description,
               'Date': t.date,
               'Personnel': memberName
             });
          });
        }
      });
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Finance Data");
    XLSX.writeFile(wb, `Finance_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Deep clone projects to modify
        const newProjects = JSON.parse(JSON.stringify(projects));
        
        // Helper to find project in nested structure
        const findProject = (list: any[], pid: string, pname: string): any => {
           for(let p of list) {
             if(p.id === pid || p.name === pname) return p;
             if(p.subProjects) {
               const found = findProject(p.subProjects, pid, pname);
               if(found) return found;
             }
           }
           return null;
        };

        let addedCount = 0;
        data.forEach((row: any) => {
           const pid = row['Project ID'] ? String(row['Project ID']) : '';
           const pname = row['Project Name'];
           const qid = row['Quarter']?.toLowerCase();
           
           // Basic validation
           if ((!pid && !pname) || !['q1','q2','q3','q4'].includes(qid)) return;

           const targetP = findProject(newProjects, pid, pname);
           if (targetP) {
             const q = targetP.quarters[qid];
             if(!q.transactions) q.transactions = [];
             
             // Check for duplicates (simple check based on desc + amount + date)
             const exists = q.transactions.some((t: any) => 
               t.description === row['Description'] && 
               t.amount === row['Amount'] && 
               t.date === row['Date']
             );

             if (!exists) {
               q.transactions.push({
                 id: Date.now().toString() + Math.random().toString().slice(2,5),
                 type: row['Type']?.toLowerCase() || 'expense',
                 amount: Number(row['Amount']) || 0,
                 description: row['Description'] || '',
                 date: row['Date'] || new Date().toISOString().split('T')[0],
                 memberId: undefined // Skipping member mapping for simplicity in import
               });
               addedCount++;
             }
           }
        });

        if (addedCount > 0) {
          onSaveProjects(newProjects);
          alert(`Successfully imported ${addedCount} records.`);
        } else {
          alert("No new records found or invalid file format.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse Excel file.");
      }
    };
    reader.readAsBinaryString(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Update Currency to CNY (RMB)
  const formatCurrency = (val: number) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(val);

  return (
    <div className={`fixed left-0 top-0 h-full w-[500px] bg-white z-[70] shadow-[40px_0_100px_rgba(0,0,0,0.1)] flex flex-col border-r border-gray-100 animate-in slide-in-from-left-10 duration-500`}>
      <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
      
      {/* Header */}
      <div className="p-8 pb-6 border-b border-gray-100 flex items-start justify-between bg-white shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-[#eaff00]"><DollarSign size={18} /></div>
             <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Management Module</span>
          </div>
          <h2 className="text-2xl font-black text-black">財務與人員管理</h2>
        </div>
        <div className="flex gap-2">
           <button onClick={handleExportExcel} className="p-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-gray-400 transition-all" title="Export Excel">
             <Download size={18}/>
           </button>
           <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-gray-400 transition-all" title="Import Excel">
             <Upload size={18}/>
           </button>
           <button onClick={onClose} className="p-3 bg-gray-50 hover:bg-black hover:text-[#eaff00] rounded-xl text-gray-400 transition-all"><X size={24}/></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-8 py-4 gap-4 border-b border-gray-50 bg-white shrink-0">
         <button onClick={() => setActiveTab('overview')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'overview' ? 'bg-black text-[#eaff00] shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
            <PieChart size={14}/> 總覽報表
         </button>
         <button onClick={() => setActiveTab('manage')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'manage' ? 'bg-black text-[#eaff00] shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
            <Wallet size={14}/> 帳務管理
         </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#fdfdfd]">
        {activeTab === 'overview' ? (
           <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm">
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-2"><TrendingUp size={14} className="text-emerald-500"/> Total Revenue</div>
                      <div className="text-xl font-black text-emerald-600">{formatCurrency(stats.income)}</div>
                  </div>
                  <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm">
                      <div className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-2"><TrendingDown size={14} className="text-rose-500"/> Total Cost</div>
                      <div className="text-xl font-black text-rose-600">{formatCurrency(stats.totalCost)}</div>
                  </div>
              </div>
              
              <div className={`bg-black text-white p-6 ${RADIUS_CLASS} shadow-lg relative overflow-hidden`}>
                 <div className="relative z-10">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">Net Profit</div>
                    <div className={`text-4xl font-black ${stats.profit >= 0 ? 'text-[#eaff00]' : 'text-rose-400'}`}>{formatCurrency(stats.profit)}</div>
                    <div className="mt-4 flex gap-4 text-[10px] font-bold text-gray-400">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Profit Margin: {stats.income ? Math.round((stats.profit/stats.income)*100) : 0}%</span>
                    </div>
                 </div>
                 {/* Decorative BG */}
                 <div className="absolute -right-5 -bottom-10 opacity-10 text-white"><DollarSign size={150} /></div>
              </div>

              {/* Breakdown */}
              <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-4">
                 <h3 className="text-xs font-bold text-black uppercase tracking-widest border-b border-gray-50 pb-2">Cost Breakdown</h3>
                 
                 <div className="space-y-3">
                    <div>
                       <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="flex items-center gap-2"><Building2 size={14} className="text-gray-400"/> Operational Expense</span>
                          <span>{formatCurrency(stats.expense)}</span>
                       </div>
                       <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${stats.totalCost ? (stats.expense/stats.totalCost)*100 : 0}%` }}></div>
                       </div>
                    </div>

                    <div>
                       <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="flex items-center gap-2"><Users size={14} className="text-gray-400"/> Personnel Salary</span>
                          <span>{formatCurrency(stats.salary)}</span>
                       </div>
                       <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: `${stats.totalCost ? (stats.salary/stats.totalCost)*100 : 0}%` }}></div>
                       </div>
                    </div>

                    <div>
                       <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="flex items-center gap-2"><Building2 size={14} className="text-gray-400"/> Tax</span>
                          <span>{formatCurrency(stats.tax)}</span>
                       </div>
                       <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500" style={{ width: `${stats.totalCost ? (stats.tax/stats.totalCost)*100 : 0}%` }}></div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        ) : (
           <div className="space-y-6">
              {/* Input Form */}
              <div className="bg-white p-5 rounded-[24px] border border-gray-200 shadow-lg space-y-4">
                 <div className="flex gap-2">
                    <select className="flex-1 bg-gray-50 p-2 rounded-xl text-xs font-bold outline-none" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                        <option value="">Select Project...</option>
                        {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select className="w-20 bg-gray-50 p-2 rounded-xl text-xs font-bold outline-none" value={selectedQuarterId} onChange={e => setSelectedQuarterId(e.target.value)}>
                        {['q1','q2','q3','q4'].map(q => <option key={q} value={q}>{q.toUpperCase()}</option>)}
                    </select>
                 </div>

                 {selectedProjectId && (
                    <div className="animate-in fade-in slide-in-from-top-2 space-y-3 pt-2 border-t border-gray-50">
                       <div className="grid grid-cols-2 gap-2">
                          <select className="bg-gray-50 p-2 rounded-xl text-xs font-bold outline-none" value={newTransType} onChange={e => setNewTransType(e.target.value as TransactionType)}>
                             <option value="income">Income (+)</option>
                             <option value="expense">Expense (-)</option>
                             <option value="salary">Salary (Personnel)</option>
                             <option value="tax">Tax</option>
                          </select>
                          <input type="date" className="bg-gray-50 p-2 rounded-xl text-xs font-bold outline-none text-gray-600" value={newTransDate} onChange={e => setNewTransDate(e.target.value)} />
                       </div>
                       
                       {newTransType === 'salary' && (
                          <select className="w-full bg-indigo-50 text-indigo-900 p-2 rounded-xl text-xs font-bold outline-none" value={newTransMember} onChange={e => setNewTransMember(e.target.value)}>
                             <option value="">Select Personnel...</option>
                             {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                       )}

                       <input placeholder="Amount (CNY)" type="number" className="w-full bg-gray-50 p-3 rounded-xl text-sm font-black outline-none placeholder:font-normal" value={newTransAmount} onChange={e => setNewTransAmount(e.target.value)} />
                       <input placeholder="Description..." className="w-full bg-gray-50 p-3 rounded-xl text-xs font-bold outline-none" value={newTransDesc} onChange={e => setNewTransDesc(e.target.value)} />
                       
                       <button onClick={handleAddTransaction} className="w-full bg-black text-[#eaff00] py-3 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all">Add Record</button>
                    </div>
                 )}
              </div>

              {/* Recent Transactions List */}
              {selectedProjectId && (
                 <div className="space-y-3 pb-10">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Transactions ({selectedQuarterId.toUpperCase()})</h3>
                    {(() => {
                        const p = allProjects.find(pro => pro.id === selectedProjectId);
                        const q = p?.quarters[selectedQuarterId as keyof typeof p.quarters];
                        const trans = q?.transactions || [];
                        
                        if (trans.length === 0) return <div className="text-center py-8 text-gray-300 text-xs italic">No records yet.</div>

                        return trans.map(t => (
                           <div key={t.id} className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-gray-300 transition-all">
                              <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                    t.type === 'income' ? 'bg-emerald-100 text-emerald-600' :
                                    t.type === 'salary' ? 'bg-purple-100 text-purple-600' :
                                    t.type === 'tax' ? 'bg-orange-100 text-orange-600' :
                                    'bg-rose-100 text-rose-600'
                                 }`}>
                                    {t.type === 'income' ? '+' : '-'}
                                 </div>
                                 <div>
                                    <div className="text-xs font-bold text-black">{t.description}</div>
                                    <div className="text-[10px] text-gray-400 font-medium flex gap-2">
                                       <span>{t.date}</span>
                                       {t.memberId && members.find(m => m.id === t.memberId) && (
                                          <span className="text-indigo-500 font-bold bg-indigo-50 px-1 rounded">@{members.find(m => m.id === t.memberId)?.name}</span>
                                       )}
                                    </div>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <span className="font-black text-sm">{formatCurrency(t.amount)}</span>
                                 <button onClick={() => handleDeleteTransaction(selectedProjectId, selectedQuarterId, t.id)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                              </div>
                           </div>
                        ));
                    })()}
                 </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
};

export default FinanceDashboard;
