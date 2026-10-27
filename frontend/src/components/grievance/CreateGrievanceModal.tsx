import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Sparkles,
  MapPin,
  Send,
  AlertCircle,
  CheckCircle,
  Flame,
  Languages,
  Upload,
  Camera,
  Shield,
  Film,
} from 'lucide-react';
import { api } from '../../services/api';

const PRESET_COORDINATES = [
  { name: 'Patna - Bailey Road Flyover', district: 'Patna Central', locality: 'Bailey Road', lat: 25.6125, lng: 85.0872 },
  { name: 'Patna - Kankarbagh Sabzi Mandi', district: 'Patna Central', locality: 'Kankarbagh', lat: 25.5962, lng: 85.1558 },
  { name: 'Patna - Boring Canal Road', district: 'Patna Central', locality: 'Boring Canal Road', lat: 25.6174, lng: 85.1142 },
  { name: 'Gaya - Railway Station Road', district: 'Gaya City', locality: 'Station Road', lat: 24.8021, lng: 85.0084 },
  { name: 'Muzaffarpur - Zero Mile Chowk', district: 'Muzaffarpur North', locality: 'Zero Mile', lat: 26.1341, lng: 85.3882 },
  { name: 'Bhagalpur - Main Market Road', district: 'Bhagalpur East', locality: 'Rajendra Nagar', lat: 25.2450, lng: 86.9855 },
];

export const CreateGrievanceModal: React.FC = () => {
  const { isCreateModalOpen, closeCreateModal, refreshAll, openCaseDrawer } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [complainantName, setComplainantName] = useState('');
  const [complainantPhone, setComplainantPhone] = useState('');
  const [district, setDistrict] = useState('Patna Central');
  const [locality, setLocality] = useState('Bailey Road');
  const [address, setAddress] = useState('Near Pillar 38, Bailey Road');
  const [latitude, setLatitude] = useState<number | null>(25.6125);
  const [longitude, setLongitude] = useState<number | null>(85.0872);
  const [originalLanguage, setOriginalLanguage] = useState<'en' | 'hi'>('en');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Phase 3 Multimodal Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isCreateModalOpen) return null;

  const handlePresetSelect = (preset: typeof PRESET_COORDINATES[0]) => {
    setDistrict(preset.district);
    setLocality(preset.locality);
    setLatitude(preset.lat);
    setLongitude(preset.lng);
    setAddress(`${preset.name}, ${preset.district}`);
  };

  // Quick client-side preview indicator
  const combinedText = `${title} ${description}`.toLowerCase();
  const hasCriticalHazard = ['spark', 'fire', 'blast', 'electrocution', 'करंट', 'आग', 'ब्लास्ट'].some(k => combinedText.includes(k));
  const isHindiDetected = /[\u0900-\u097F]/.test(title + description);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setFilePreview('VIDEO_ATTACHED');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || title.trim().length < 5) {
      setErrorMsg('Title must be at least 5 characters');
      return;
    }
    if (!description || description.trim().length < 10) {
      setErrorMsg('Description must be at least 10 characters');
      return;
    }
    if (!complainantName || !complainantPhone) {
      setErrorMsg('Complainant name and 10-digit phone number are required');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let created;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('complainantName', complainantName);
        formData.append('complainantPhone', complainantPhone);
        formData.append('isAnonymous', String(isAnonymous));
        formData.append('originalLanguage', isHindiDetected ? 'hi' : originalLanguage);
        formData.append('district', district);
        formData.append('locality', locality);
        formData.append('address', address);
        if (latitude !== null) formData.append('latitude', String(latitude));
        if (longitude !== null) formData.append('longitude', String(longitude));
        formData.append('media', selectedFile);

        created = await api.createGrievance(formData);
      } else {
        created = await api.createGrievance({
          title,
          description,
          complainantName,
          complainantPhone,
          isAnonymous,
          originalLanguage: isHindiDetected ? 'hi' : originalLanguage,
          district,
          locality,
          address,
          latitude: latitude ?? undefined,
          longitude: longitude ?? undefined,
        });
      }

      refreshAll();
      closeCreateModal();
      openCaseDrawer(created.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit grievance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Ingest Citizen Grievance</h3>
              <p className="text-xs text-slate-400">Bilingual Public Intake with Automatic AI Analysis</p>
            </div>
          </div>
          <button
            onClick={closeCreateModal}
            className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick presets for Bihar locations */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Quick Bihar Location Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COORDINATES.map(p => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handlePresetSelect(p)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                    locality === p.locality
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 font-semibold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">Complaint Headline / शीर्षक</label>
              <span className="text-[10px] text-slate-500 font-mono">Bilingual (English / हिन्दी)</span>
            </div>
            <input
              type="text"
              placeholder="e.g. 11kV transformer sparking violently / कंकड़बाग में बिजली के तार से चिंगारी"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-950 text-slate-100 text-xs rounded-lg p-2.5 border border-slate-800 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Detailed Grievance Narrative / विस्तृत शिकायत विवरण
            </label>
            <textarea
              rows={3}
              placeholder="Describe the physical disruption, exact location, danger to citizens, duration of problem..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-950 text-slate-100 text-xs rounded-lg p-2.5 border border-slate-800 focus:outline-none focus:border-cyan-500 leading-relaxed"
              required
            />
          </div>

          {/* AI Live Analysis Preview Card */}
          {(title || description) && (
            <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-cyan-300">AI Preview:</span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {isHindiDetected ? 'हिन्दी (Hindi NLP Mode)' : 'English NLP Mode'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasCriticalHazard ? (
                  <span className="inline-flex items-center gap-1 font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-500/50 text-[10px] uppercase">
                    <Flame className="w-3 h-3" /> Critical Hazard
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">Standard Priority</span>
                )}
              </div>
            </div>
          )}

          {/* Complainant Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Complainant Full Name</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Chandra (Citizen)"
                value={complainantName}
                onChange={e => setComplainantName(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 text-xs rounded-lg p-2 border border-slate-800 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Mobile Contact Phone</label>
              <input
                type="tel"
                placeholder="e.g. 9835012345"
                value={complainantPhone}
                onChange={e => setComplainantPhone(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 text-xs rounded-lg p-2 border border-slate-800 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          {/* Address & Locality */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">District</label>
              <select
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 text-xs rounded-lg p-2 border border-slate-800 focus:outline-none focus:border-cyan-500 font-medium"
              >
                <option value="Patna Central">Patna Central</option>
                <option value="Gaya City">Gaya City</option>
                <option value="Muzaffarpur North">Muzaffarpur North</option>
                <option value="Bhagalpur East">Bhagalpur East</option>
                <option value="Darbhanga West">Darbhanga West</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Locality / Ward</label>
              <input
                type="text"
                placeholder="e.g. Bailey Road, Kankarbagh"
                value={locality}
                onChange={e => setLocality(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 text-xs rounded-lg p-2 border border-slate-800 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Street Address & Landmark</label>
            <input
              type="text"
              placeholder="e.g. Pillar 42, Bailey Road Flyover Junction, Opposite Paras lane"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full bg-slate-950 text-slate-100 text-xs rounded-lg p-2 border border-slate-800 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* Phase 3: Multimodal Photographic / Video Evidence Upload */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>Photographic / Video Evidence (Phase 3 AI Vision)</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">JPG, PNG, MP4 (Max 50MB)</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 p-3 border border-dashed border-slate-700 hover:border-cyan-500/60 rounded-lg bg-slate-900/60 text-xs text-slate-300 transition-colors">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>{selectedFile ? selectedFile.name : 'Choose Image or Short Video'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {selectedFile && (
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                  className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 bg-rose-950/40 rounded border border-rose-500/30"
                >
                  Remove
                </button>
              )}
            </div>

            {filePreview && filePreview !== 'VIDEO_ATTACHED' && (
              <div className="mt-2 rounded-lg overflow-hidden border border-slate-700 max-h-32 flex items-center justify-center bg-black">
                <img src={filePreview} alt="Preview" className="max-h-32 object-contain" />
              </div>
            )}
            {filePreview === 'VIDEO_ATTACHED' && (
              <div className="mt-2 p-2 bg-indigo-950/40 border border-indigo-500/30 rounded text-xs text-indigo-300 flex items-center gap-2">
                <Film className="w-4 h-4 text-indigo-400" />
                <span>Video attached. AI pipeline will sample 3 keyframes for infrastructure hazard detection.</span>
              </div>
            )}
          </div>

          {/* Phase 3: Privacy & Anonymous Protection Toggle */}
          <div className="flex items-center justify-between p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <span className="font-semibold text-purple-200">Withhold Identity (Anonymous Citizen Mode)</span>
                <p className="text-[10px] text-purple-300/70">
                  Phone and personal details will be automatically redacted from public logs and non-admin viewers.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 bg-slate-900 border-slate-700"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeCreateModal}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Ingesting & Analyzing...' : 'Dispatch Grievance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
