
/**
 * Origin Private File System (OPFS) helper for SVI Pro.
 * Handles video blobs and anchor frames caching.
 */

export async function opfsWriteFile(path: string, data: Blob | ArrayBuffer) {
  const root = await navigator.storage.getDirectory();
  const parts = path.split("/").filter(Boolean);
  let dir = root;
  
  for (let i = 0; i < parts.length - 1; i++) {
    dir = await dir.getDirectoryHandle(parts[i], { create: true });
  }
  
  const fileHandle = await dir.getFileHandle(parts[parts.length - 1], { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
}

export async function opfsReadFile(path: string): Promise<File> {
  const root = await navigator.storage.getDirectory();
  const parts = path.split("/").filter(Boolean);
  let dir = root;
  
  for (let i = 0; i < parts.length - 1; i++) {
    dir = await dir.getDirectoryHandle(parts[i]);
  }
  
  const fileHandle = await dir.getFileHandle(parts[parts.length - 1]);
  return await fileHandle.getFile();
}

export async function opfsGetUrl(path: string): Promise<string> {
  try {
    const file = await opfsReadFile(path);
    return URL.createObjectURL(file);
  } catch (e) {
    console.error("OPFS Access Error:", e);
    return "";
  }
}
