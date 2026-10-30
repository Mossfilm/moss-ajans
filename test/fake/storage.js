// Sahte Firebase Storage (yalnızca test): dosyayı tarayıcı içinde blob URL olarak tutar
const blobs = new Map();
export const getStorage = () => ({ fake: true });
export const ref = (_s, path) => ({ path });
export function uploadBytesResumable(r, file) {
  const handlers = [];
  const task = {
    snapshot: { state: 'running', bytesTransferred: 0, totalBytes: file.size || 1, ref: r },
    on: (_ev, progress, error, done) => {
      handlers.push({ progress, error, done });
      let n = 0;
      const step = () => {
        n += 1;
        task.snapshot.bytesTransferred = Math.min(task.snapshot.totalBytes, Math.round((task.snapshot.totalBytes * n) / 3));
        progress && progress(task.snapshot);
        if (n < 3) setTimeout(step, 60);
        else { task.snapshot.state = 'success'; blobs.set(r.path, URL.createObjectURL(file)); done && done(); }
      };
      setTimeout(step, 30);
    }
  };
  return task;
}
export async function getDownloadURL(r) { return blobs.get(r.path) || ''; }
