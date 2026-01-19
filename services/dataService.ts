
import { Project, Member } from '../types';
import { INITIAL_MEMBERS } from '../constants';

const STORAGE_KEY_PROJECTS = 'mindmap-projects-v2026';
const STORAGE_KEY_MEMBERS = 'mindmap-members-v2026';
const SYNC_CHANNEL = 'business-plan-sync';

const channel = new BroadcastChannel(SYNC_CHANNEL);

export const DataService = {
  loadProjects: (): Project[] | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROJECTS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },
  saveProjects: (projects: Project[], silent = false) => {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    if (!silent) {
      channel.postMessage({ type: 'PROJECTS_UPDATED', data: projects });
    }
  },
  loadMembers: (): Member[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY_MEMBERS);
      return data ? JSON.parse(data) : INITIAL_MEMBERS;
    } catch (e) {
      return INITIAL_MEMBERS;
    }
  },
  saveMembers: (members: Member[], silent = false) => {
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
    if (!silent) {
      channel.postMessage({ type: 'MEMBERS_UPDATED', data: members });
    }
  },
  onSync: (callback: (type: string, data: any) => void) => {
    channel.onmessage = (event) => {
      callback(event.data.type, event.data.data);
    };
  },
  exportData: (projects: Project[], members: Member[]) => {
    const dataStr = JSON.stringify({ projects, members }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `2026_Business_Plan_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
  importData: (file: File): Promise<{ projects: Project[], members: Member[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          if (data && data.projects && data.members) {
            resolve(data);
          } else {
            reject(new Error("無效的檔案格式：缺少業務項目或成員數據。"));
          }
        } catch (err) {
          reject(new Error("解析 JSON 失敗，請確保檔案格式正確。"));
        }
      };
      reader.onerror = () => reject(new Error("讀取檔案出錯。"));
      reader.readAsText(file);
    });
  }
};
