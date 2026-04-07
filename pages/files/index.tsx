'use client';

import AdminLayout from '@/components/Layout/AdminLayout'
import { useState, useEffect, useCallback } from 'react';
import { FileManager } from '@ray-solutions/react-file-manager/dist/react-file-manager.es.js';
import '@ray-solutions/react-file-manager/dist/react-file-manager.css';
import api from '@/lib/axios';
import type { FMFile, LaravelContentResponse } from '@/schemas/fileManager';

const DISK = 'public' as const;

const toIso = (timestamp?: number): string =>
  timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString();

const toComponentPath = (p: string): string => (p ? `/${p}` : '/');

const toLaravelPath = (p: unknown): string => {
  if (typeof p === 'string') return p.replace(/^\//, '');
  if (p && typeof p === 'object') {
    const obj = p as Record<string, unknown>;
    const raw = obj.path ?? obj.name ?? '';
    return String(raw).replace(/^\//, '');
  }
  return '';
};

const mapResponse = (data: LaravelContentResponse): FMFile[] => {
  const rawDirs  = Array.isArray(data.directories) ? data.directories : [];
  const rawFiles = Array.isArray(data.files)       ? data.files       : [];

  const dirs: FMFile[] = rawDirs.map((d) => ({
    name:        d.basename,
    isDirectory: true,
    path:        toComponentPath(d.path),
    updatedAt:   toIso(d.timestamp),
  }));

  const fileList: FMFile[] = rawFiles
    .filter((f) => !f.basename.startsWith('.'))
    .map((f) => ({
      name:        f.basename,
      isDirectory: false,
      path:        toComponentPath(f.path),
      size:        f.size ?? 0,
      updatedAt:   toIso(f.timestamp),
    }));

  return [...dirs, ...fileList];
};

export default function FileManagerPage() {
  // ✅ Store ALL files fetched so far — component filters internally by path
  const [allFiles, setAllFiles]       = useState<FMFile[]>([]);
  const [loading, setLoading]         = useState<boolean>(true);
  const [error, setError]             = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');

  // ✅ Fetch and MERGE into allFiles — don't replace
  const fetchAndMerge = useCallback(async (laravelPath: string = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<LaravelContentResponse>(
        '/file-manager/content',
        { params: { disk: DISK, path: laravelPath } }
      );

      const newItems = mapResponse(res.data);

      setAllFiles((prev) => {
        // Remove old entries for this path level, then add new ones
        const newPaths = new Set(newItems.map((f) => f.path));
        const filtered = prev.filter((f) => !newPaths.has(f.path));
        return [...filtered, ...newItems];
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Fetch error:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndMerge();
  }, [fetchAndMerge]);

  // ── Navigate — fetch new folder contents and merge ─────────────
  const handleFolderChange = (path: unknown): void => {
    const laravelPath = toLaravelPath(path);
    setCurrentPath(laravelPath);
    fetchAndMerge(laravelPath);
  };

  const handleCreateFolder = async (
    folderName: string,
    parentPath: unknown
  ): Promise<void> => {
    try {
      const safePath = toLaravelPath(parentPath) || currentPath;
      await api.post('/file-manager/create-directory', {
        disk: DISK, path: safePath, name: folderName,
      });
      await fetchAndMerge(currentPath);
    } catch (err) { console.error('Create folder error:', err); }
  };

  const handleUpload = async (
    uploadedFiles: File[],
    uploadPath: string
  ): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append('disk', DISK);
      formData.append('path', toLaravelPath(uploadPath) || currentPath);
      uploadedFiles.forEach((file) => formData.append('files[]', file));
      await api.post('/file-manager/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchAndMerge(currentPath);
    } catch (err) { console.error('Upload error:', err); }
  };

  const handleDelete = async (items: FMFile[]): Promise<void> => {
    try {
      const paths = items.map((i) => toLaravelPath(i.path));
      await api.delete('/file-manager/delete', {
        data: { disk: DISK, items: paths },
      });
      // ✅ Remove deleted items from allFiles immediately
      setAllFiles((prev) =>
        prev.filter((f) => !paths.includes(toLaravelPath(f.path)))
      );
      await fetchAndMerge(currentPath);
    } catch (err) { console.error('Delete error:', err); }
  };

  const handleRename = async (
    file: FMFile,
    newName: string
  ): Promise<void> => {
    try {
      const oldPath = toLaravelPath(file.path);
      const parent  = oldPath.substring(0, oldPath.lastIndexOf('/'));
      const newPath = parent ? `${parent}/${newName}` : newName;
      await api.post('/file-manager/rename', {
        disk:    DISK,
        newName: newPath,
        oldName: oldPath,
        type:    file.isDirectory ? 'dir' : 'file',
      });
      await fetchAndMerge(currentPath);
    } catch (err) { console.error('Rename error:', err); }
  };

  return (
    <div style={{ padding: '24px', height: '100vh' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>
        📁 File Manager
      </h1>

      {error && (
        <div style={{
          background: '#fee2e2', color: '#b91c1c',
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
        }}>
          ❌ {error}
        </div>
      )}

      {loading ? (
        <p>⏳ Loading files...</p>
      ) : (
        <div style={{ height: 'calc(100vh - 100px)' }}>
          <FileManager
            files={allFiles}
            initialPath={currentPath ? `/${currentPath}` : ''}
            filePreviewPath={`${process.env.NEXT_PUBLIC_API_URL}/storage`}
            onFolderChange={handleFolderChange}
            onCreateFolder={handleCreateFolder}
            onFileUpload={handleUpload}
            onDelete={handleDelete}
            onRename={handleRename}
            permissions={[
                {
                path: '/**',
                read: true, create: true, delete: true,
                rename: true, upload: true, download: true,
                copy: true, move: true,
                },
            ]}
        />
        </div>
      )}
    </div>
  );
}

FileManagerPage.Layout = AdminLayout