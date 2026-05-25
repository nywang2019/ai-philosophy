// IndexedDB 图片存储 - 用于多模态图片管理

const DB_NAME = "ai-philosophy-images";
const STORE_NAME = "images";
const DB_VERSION = 1;

interface StoredImage {
  id: string;
  data: string;
  size: number;
  createdAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => { dbPromise = null; reject(req.error); };
  });
  return dbPromise;
}

async function storeRequest<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// 存储图片，返回 imageId
export async function saveImage(base64Data: string, size: number): Promise<string> {
  const id = "img_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await storeRequest("readwrite", store => {
    return store.add({ id, data: base64Data, size, createdAt: Date.now() });
  });
  return id;
}

// 根据 imageId 获取图片数据
export async function getImage(id: string): Promise<StoredImage | undefined> {
  try {
    return await storeRequest("readonly", store => store.get(id));
  } catch (e) {
    console.error("[imageStore] getImage failed for", id, e);
    return undefined;
  }
}

// 删除图片
export async function deleteImage(id: string): Promise<void> {
  await storeRequest("readwrite", store => store.delete(id));
}

// 获取所有图片ID
export async function getAllImageIds(): Promise<string[]> {
  const all = await storeRequest("readonly", store => store.getAll());
  return all.map((img: StoredImage) => img.id);
}
