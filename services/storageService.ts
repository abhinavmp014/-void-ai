
import { ChatSession, UserProfile } from "../types.ts";

const CHATS_KEY = 'void_ai_chats';
const PROFILE_KEY = 'void_ai_profile';

export const saveChats = (chats: ChatSession[]) => {
  try {
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  } catch (e) {
    console.error("Failed to save chats:", e);
  }
};

export const loadChats = (): ChatSession[] => {
  try {
    const stored = localStorage.getItem(CHATS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to load chats, resetting to empty:", e);
    return [];
  }
};

export const saveProfile = (profile: UserProfile) => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save profile:", e);
  }
};

export const loadProfile = (defaultProfile: UserProfile): UserProfile => {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (!stored) return defaultProfile;
    const parsed = JSON.parse(stored);
    return { ...defaultProfile, ...parsed };
  } catch (e) {
    console.error("Failed to load profile, resetting to default:", e);
    return defaultProfile;
  }
};
