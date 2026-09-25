import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderPlus, 
  Building2, 
  Layers, 
  UploadCloud, 
  Sparkles, 
  FileText, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { PageContainer } from '../components/layout/PageContainer';
import { projectApi } from '../services/api';

export const NewProject: React.FC = () => {
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [buildingType, setBuildingType] = useState('Commercial');
  const [floors, setFloors] = useState<number>(2);

  // File uploads
  const [blueprintFile, setBlueprintFile] = useState<File | null>(null);
  const [sitePhotos, setSitePhotos] = useState<File[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to load sample files
  const handleLoadSampleBlueprint = async () => {
    try {
      const response = await fetch('/demo/blueprint.svg');
      const blob = await response.blob();
      const file = new File([blob], 'demo_commercial_blueprint.svg', { type: 'image/svg+xml' });
      setBlueprintFile(file);
      if (!name) setName('Westfield Commercial Center');
    } catch (e) {
      console.error('Failed to load sample blueprint', e);
    }
  };

  const handleLoadSamplePhotos = async () => {
    try {
      const p1 = await fetch('/demo/site-01.jpg');
      const b1 = await p1.blob();
      const f1 = new File([b1], 'site_corridor_c.jpg', { type: 'image/jpeg' });

      const p2 = await fetch('/demo/site-02.jpg');
      const b2 = await p2.blob();
      const f2 = new File([b2], 'site_stair_01.jpg', { type: 'image/jpeg' });

      setSitePhotos([f1, f2]);
    } catch (e) {
      console.error('Failed to load sample photos', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please specify a project name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create Project
      const project = await projectApi.createProject({
        name: name.trim(),
        building_type: buildingType,
        floors: Number(floors) || 1,
      });

      // 2. Upload Blueprint if attached
      if (blueprintFile) {
        await projectApi.uploadBlueprint(project.id, blueprintFile);
      }

      // 3. Upload Site Photos if attached
      if (sitePhotos.length > 0) {
        await projectApi.uploadPhotos(project.id, sitePhotos);
      }

      // 4. Automatically trigger initial structural analysis
      await projectApi.analyzeProject(project.id);

      // 5. Navigate to Project Workspace
      navigate(`/projects/${project.id}`);
    } catch (err: any) {
      console.error('Project creation failed', err);
      setError(err?.response?.data?.detail || 'Failed to create project. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Create New Project"
        subtitle="Initialize architectural model, blueprint ingestion, and site verification"
      />

      <PageContainer className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Building Specs */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-700/50 pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-sky-400" />
                <h3 className="font-semibold text-white text-base">Facility Details</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setName('Metropolitan Hospital Wing B');
                  setBuildingType('Healthcare');
                  setFloors(3);
                  handleLoadSampleBlueprint();
                  handleLoadSamplePhotos();
                }}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Quick Prefill Demo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Project / Facility Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Commercial Tower, Floor 1 Egress"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Building Type
                </label>
                <select
                  value={buildingType}
                  onChange={(e) => setBuildingType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
                >
                  <option value="Commercial">Commercial (Office / Retail)</option>
                  <option value="Residential">Residential Complex</option>
                  <option value="Healthcare">Healthcare / Hospital</option>
                  <option value="Educational">Educational Campus</option>
                  <option value="Industrial">Industrial / Warehouse</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Total Floors
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={floors}
                  onChange={(e) => setFloors(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Blueprint & Photos Upload Card */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-700/50 pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UploadCloud className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-white text-base">Drawings & Site Imagery</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Blueprint */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Floor Plan / Blueprint
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadSampleBlueprint}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Load Sample
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-700 hover:border-sky-500/50 rounded-xl p-6 text-center transition-all bg-slate-900/40 relative">
                  <input
                    type="file"
                    accept="image/*,.pdf,.svg"
                    onChange={(e) => e.target.files && setBlueprintFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                    <FileText className="w-8 h-8 text-sky-400" />
                    {blueprintFile ? (
                      <div className="text-xs text-slate-200 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-sky-400 truncate max-w-[200px]">{blueprintFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-medium text-slate-300">
                          Select blueprint file
                        </p>
                        <p className="text-[10px] text-slate-400">
                          PNG, JPG, SVG CAD layout
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Site Photos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Site Verification Photos
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadSamplePhotos}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Load Sample (2)
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl p-6 text-center transition-all bg-slate-900/40 relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && setSitePhotos(Array.from(e.target.files))}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                    <ImageIcon className="w-8 h-8 text-indigo-400" />
                    {sitePhotos.length > 0 ? (
                      <div className="text-xs text-slate-200 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-indigo-400">{sitePhotos.length} site photo(s) selected</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-medium text-slate-300">
                          Select site inspection photos
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Corridors, fire doors, stairwells
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all flex items-center gap-2 active:scale-95"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{loading ? 'Creating & Analyzing...' : 'Create & Launch Workspace'}</span>
            </button>
          </div>
        </form>
      </PageContainer>
    </div>
  );
};
