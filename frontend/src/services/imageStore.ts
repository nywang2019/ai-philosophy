// IndexedDB 图片存储 - 用于多模态图片管理

const DB_NAME = "ai-philosophy-images";
const STORE_NAME = "images";
const DB_VERSION = 1;

interface StoredImage {
  id: string;
  data: string;        // 压缩版，用于 API 调用
  originalData: string; // 原图，用于查看预览
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

// 存储图片，返回 imageId。compressed 用于 API 调用，original 用于预览
export async function saveImage(compressed: string, original: string, size: number): Promise<string> {
  const id = "img_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await storeRequest("readwrite", store => {
    return store.add({ id, data: compressed, originalData: original, size, createdAt: Date.now() });
  });
  return id;
}

// 根据 imageId 获取图片压缩版（用于 API 调用）
export async function getImage(id: string): Promise<StoredImage | undefined> {
  try {
    return await storeRequest("readonly", store => store.get(id));
  } catch (e) {
    console.error("[imageStore] getImage failed for", id, e);
    return undefined;
  }
}

// 获取图片原图（用于预览）
export async function getImageOriginal(id: string): Promise<string | undefined> {
  try {
    const img = await storeRequest("readonly", store => store.get(id)) as StoredImage | undefined;
    return img?.originalData || img?.data; // 兼容旧数据：无 originalData 时降级到压缩版
  } catch {
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
