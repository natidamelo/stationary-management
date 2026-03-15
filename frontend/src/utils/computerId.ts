const COMPUTER_ID_KEY = 'stationery_computer_id';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getComputerId(): string {
  try {
    let id = localStorage.getItem(COMPUTER_ID_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(COMPUTER_ID_KEY, id);
    }
    return id;
  } catch {
    return generateId();
  }
}
