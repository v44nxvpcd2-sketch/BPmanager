
import { Project, Member } from '../types';
import { INITIAL_MEMBERS } from '../constants';
import { database } from '../src/firebase';
import { ref, onValue, set, get, child } from "firebase/database";

const DB_PROJECTS_PATH = 'mindmap/projects';
const DB_MEMBERS_PATH = 'mindmap/members';

export const DataService = {
  // Subscribe to real-time updates for projects
  subscribeProjects: (callback: (data: Project[]) => void) => {
    const projectsRef = ref(database, DB_PROJECTS_PATH);
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      const data = snapshot.val();
      callback(data || []); // If null (empty DB), return empty array
    });
    return unsubscribe; // Return cleanup function
  },

  // Subscribe to real-time updates for members
  subscribeMembers: (callback: (data: Member[]) => void) => {
    const membersRef = ref(database, DB_MEMBERS_PATH);
    const unsubscribe = onValue(membersRef, (snapshot) => {
      const data = snapshot.val();
      callback(data || INITIAL_MEMBERS);
    });
    return unsubscribe;
  },

  // Save projects to Cloud
  saveProjects: async (projects: Project[]) => {
    try {
      await set(ref(database, DB_PROJECTS_PATH), projects);
    } catch (e) {
      console.error("Error saving projects to Firebase:", e);
    }
  },

  // Save members to Cloud
  saveMembers: async (members: Member[]) => {
    try {
      await set(ref(database, DB_MEMBERS_PATH), members);
    } catch (e) {
      console.error("Error saving members to Firebase:", e);
    }
  },

  // Deprecated: legacy sync listener (kept empty to avoid breaking calling code if any)
  onSync: (callback: (type: string, data: any) => void) => {
    // Firebase onValue handles sync now.
  },

  // Export local JSON (still useful for backups)
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

  // Import JSON to Cloud
  importData: (file: File): Promise<{ projects: Project[], members: Member[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          if (data && data.projects && data.members) {
            // Upon import, immediately save to Cloud to update everyone
            await set(ref(database, DB_PROJECTS_PATH), data.projects);
            await set(ref(database, DB_MEMBERS_PATH), data.members);
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
