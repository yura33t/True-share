
import React, { useState, useRef } from 'react';
import { supabase } from '../supabase';
import { Profile } from '../types';
import { Camera, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  profile: Profile;
  onSave: () => void;
}

export const EditProfile: React.FC<Props> = ({ profile, onSave }) => {
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [bannerUrl, setBannerUrl] = useState(profile.banner_url || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reduced to 1MB to prevent "eternal loading" caused by massive Base64 payloads
    if (file.size > 1024 * 1024 * 1) { 
        alert("Image is too large. Please select an image smaller than 1MB for better performance.");
        return;
    }

    const reader = new FileReader();
    reader.onloadstart = () => setSaving(true);
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === 'avatar') setAvatarUrl(base64);
      else setBannerUrl(base64);
      setSaving(false);
    };
    reader.onerror = () => {
      alert("Failed to read file.");
      setSaving(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                display_name: displayName.trim(),
                bio: bio.trim(),
                avatar_url: avatarUrl,
                banner_url: bannerUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', profile.id);
        
        if (updateError) throw updateError;
        
        setSuccess(true);
        // Small delay to show success state before switching view
        setTimeout(() => {
            onSave();
        }, 800);
    } catch (err: any) {
        setError(err.message || "Failed to update profile.");
        setSaving(false);
    }
  };

  const getAvatar = (url: string | null) => {
    return url && url.length > 10 ? url : `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 pb-32">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold tracking-tight uppercase italic">Edit Profile</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Banner Selection */}
        <div className="relative group">
            <div className="h-40 w-full bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 relative">
                {bannerUrl ? (
                    <img src={bannerUrl} className="w-full h-full object-cover opacity-60" alt="Banner Preview" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-black" />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                    <button 
                        type="button"
                        disabled={saving}
                        onClick={() => bannerInputRef.current?.click()}
                        className="bg-black/50 backdrop-blur-md p-3 rounded-full border border-white/20 hover:scale-110 transition-all text-white disabled:opacity-50"
                    >
                        <ImageIcon size={24} />
                    </button>
                </div>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-2 text-center">Profile Banner (Max 1MB)</p>
            <input 
                type="file" 
                ref={bannerInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, 'banner')} 
            />
        </div>

        {/* Avatar Selection */}
        <div className="flex flex-col items-center -mt-20 relative z-10">
            <div className="relative group">
                <img 
                    src={getAvatar(avatarUrl)} 
                    className="w-32 h-32 rounded-full object-cover border-4 border-black bg-black shadow-xl"
                    alt="Avatar Preview"
                />
                <button 
                    type="button"
                    disabled={saving}
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white disabled:opacity-50"
                >
                    <Camera size={24} />
                </button>
            </div>
            <input 
                type="file" 
                ref={avatarInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, 'avatar')} 
            />
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-2">Change Avatar (Max 1MB)</p>
        </div>

        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-zinc-500 mb-2">Display Name</label>
                <input 
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-all text-white"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your visible name"
                    disabled={saving}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-500 mb-2">Bio</label>
                <textarea 
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white resize-none transition-all text-white"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the world about yourself..."
                    disabled={saving}
                />
            </div>
        </div>

        {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-2">
                <AlertCircle size={18} />
                <span>{error}</span>
            </div>
        )}

        <div className="flex flex-col gap-4">
            <button
                type="submit"
                disabled={saving || success}
                className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                    success ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-zinc-200'
                } disabled:opacity-50`}
            >
                {saving ? (
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        <span>Processing...</span>
                    </div>
                ) : success ? (
                    <>
                        <CheckCircle2 size={20} />
                        <span>Profile Updated</span>
                    </>
                ) : 'Save All Changes'}
            </button>
            
            <button 
                type="button"
                onClick={() => onSave()}
                className="w-full py-4 text-zinc-500 hover:text-white transition-colors font-medium"
                disabled={saving}
            >
                Cancel
            </button>
        </div>
      </form>
    </div>
  );
};
