import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, FileText, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
import { projectApi } from '../../services/api';

interface UploadPanelProps {
  projectId: number;
  blueprintPath?: string | null;
  onUploaded?: () => void;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({
  projectId,
  blueprintPath,
  onUploaded,
}) => {
  const [blueprintFile, setBlueprintFile] = useState<File | null>(null);
  const [sitePhotos, setSitePhotos] = useState<File[]>([]);
  const [uploadingBlueprint, setUploadingBlueprint] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleBlueprintChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBlueprintFile(e.target.files[0]);
    }
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSitePhotos(Array.from(e.target.files));
    }
  };

  const submitBlueprint = async () => {
    if (!blueprintFile) return;
    setUploadingBlueprint(true);
    setStatusMessage(null);
    try {
      await projectApi.uploadBlueprint(projectId, blueprintFile);
      setStatusMessage({ type: 'success', text: 'Blueprint uploaded successfully!' });
      setBlueprintFile(null);
      if (onUploaded) onUploaded();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.response?.data?.detail || 'Failed to upload blueprint.' });
    } finally {
      setUploadingBlueprint(false);
    }
  };

  const submitPhotos = async () => {
    if (sitePhotos.length === 0) return;
    setUploadingPhotos(true);
    setStatusMessage(null);
    try {
      await projectApi.uploadPhotos(projectId, sitePhotos);
      setStatusMessage({ type: 'success', text: `${sitePhotos.length} site photos uploaded successfully!` });
      setSitePhotos([]);
      if (onUploaded) onUploaded();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.response?.data?.detail || 'Failed to upload photos.' });
    } finally {
      setUploadingPhotos(false);
    }
  };

  // Helper to load bundled demo assets
  const loadDemoBlueprint = async () => {
    try {
      const response = await fetch('/demo/blueprint.svg');
      const blob = await response.blob();
      const file = new File([blob], 'demo_blueprint.svg', { type: 'image/svg+xml' });
      setBlueprintFile(file);
    } catch (e) {
      console.error('Failed to load demo asset', e);
    }
  };

  const loadDemoPhotos = async () => {
    try {
      const p1 = await fetch('/demo/site-01.jpg');
      const b1 = await p1.blob();
      const f1 = new File([b1], 'site_01.jpg', { type: 'image/jpeg' });

      const p2 = await fetch('/demo/site-02.jpg');
      const b2 = await p2.blob();
      const f2 = new File([b2], 'site_02.jpg', { type: 'image/jpeg' });

      setSitePhotos([f1, f2]);
    } catch (e) {
      console.error('Failed to load demo photos', e);
    }
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
        <div>
          <h3 className="font-semibold text-white text-base flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-sky-400" />
            Project Documents & Site Verification
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload floor plan CAD/blueprint and on-site photos for egress compliance audit.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blueprint Upload */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              1. Architectural Blueprint
            </label>
            <button
              type="button"
              onClick={loadDemoBlueprint}
              className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Load Sample Blueprint
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-700 hover:border-sky-500/50 rounded-xl p-5 text-center transition-all bg-slate-900/40 relative">
            <input
              type="file"
              accept="image/*,.pdf,.svg"
              onChange={handleBlueprintChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
              <FileText className="w-8 h-8 text-sky-400" />
              {blueprintFile ? (
                <div className="text-xs text-slate-200 font-medium">
                  Selected: <span className="text-sky-400">{blueprintFile.name}</span>
                </div>
              ) : (
                <>
                  <p className="text-xs font-medium text-slate-300">
                    Drop blueprint file here or click to browse
                  </p>
                  <p className="text-[10px] text-slate-400">
                    PNG, JPG, SVG, CAD export (Max 25MB)
                  </p>
                </>
              )}
            </div>
          </div>

          {blueprintFile && (
            <button
              onClick={submitBlueprint}
              disabled={uploadingBlueprint}
              className="w-full py-2 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-xs font-semibold shadow transition-all flex items-center justify-center gap-2"
            >
              {uploadingBlueprint ? 'Uploading...' : 'Confirm Blueprint Upload'}
            </button>
          )}
        </div>

        {/* Site Photos Upload */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              2. Site Inspection Photos
            </label>
            <button
              type="button"
              onClick={loadDemoPhotos}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Load Sample Photos (2)
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl p-5 text-center transition-all bg-slate-900/40 relative">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotosChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
              <ImageIcon className="w-8 h-8 text-indigo-400" />
              {sitePhotos.length > 0 ? (
                <div className="text-xs text-slate-200 font-medium">
                  Selected: <span className="text-indigo-400">{sitePhotos.length} photo(s)</span>
                </div>
              ) : (
                <>
                  <p className="text-xs font-medium text-slate-300">
                    Drop site photos here or click to browse
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Multi-file upload supported (JPG, PNG)
                  </p>
                </>
              )}
            </div>
          </div>

          {sitePhotos.length > 0 && (
            <button
              onClick={submitPhotos}
              disabled={uploadingPhotos}
              className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition-all flex items-center justify-center gap-2"
            >
              {uploadingPhotos ? 'Uploading...' : `Upload ${sitePhotos.length} Site Photo(s)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
