const SESSION_ID_KEY = 'chefito_session_id';
const STORY_VIEWED_KEY = 'chefito_story_viewed';

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function getSessionId(): string {
  try {
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);

    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }

    return sessionId;
  } catch {
    console.warn('SessionStorage não disponível, usando sessão temporária');
    return generateSessionId();
  }
}

export function hasViewedStory(storyImageUrl: string): boolean {
  try {
    const viewedData = sessionStorage.getItem(STORY_VIEWED_KEY);
    if (!viewedData) return false;

    const viewed = JSON.parse(viewedData);
    return viewed[storyImageUrl] === true;
  } catch {
    return false;
  }
}

export function markStoryAsViewed(storyImageUrl: string): void {
  try {
    const viewedData = sessionStorage.getItem(STORY_VIEWED_KEY);
    const viewed = viewedData ? JSON.parse(viewedData) : {};

    viewed[storyImageUrl] = true;
    sessionStorage.setItem(STORY_VIEWED_KEY, JSON.stringify(viewed));
  } catch {
    console.warn('Não foi possível marcar story como visualizado');
  }
}

export function clearStoryViews(): void {
  try {
    sessionStorage.removeItem(STORY_VIEWED_KEY);
  } catch {
    console.warn('Não foi possível limpar visualizações do story');
  }
}

export function getStoryImageHash(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
