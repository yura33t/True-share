
import React, { useState, useRef } from 'react';
import { supabase } from '../supabase';
import { Profile } from '../types';
import { Camera, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';

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
    if (file.size > 1024 * 1024) { alert("Файл слишком большой (макс 1МБ)"); return; }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (type === 'avatar') setAvatarUrl(base64); else setBannerUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSuccess(false); setError(null);
    try {
        const { error } = await supabase.from('profiles').update({
            display_name: displayName.trim(),
            bio: bio.trim(),
            avatar_url: avatarUrl,
            banner_url: bannerUrl,
            updated_at: new Date().toISOString()
        }).eq('id', profile.id);
        if (error) throw error;
        setSuccess(true);
        setTimeout(onSave, 1000);
    } catch (err: any) { setError(err.message); setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 pb-32">
      <h2 className="text-3xl font-black italic tracking-tighter mb-10 uppercase">Профиль</h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="relative">
            <div className="h-44 w-full bg-zinc-950 rounded-[32px] overflow-hidden border border-white/5 relative group">
                {bannerUrl ? <img src={bannerUrl} className="w-full h-full object-cover opacity-50" alt="" /> : <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-black" />}
                <button type="button" onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageIcon size={30} />
                </button>
            </div>
            <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
        </div>

        <div className="flex flex-col items-center -mt-20 relative z-10">
            <div className="relative group">
                <img src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} className="w-32 h-32 rounded-[40px] object-cover border-8 border-black bg-black shadow-2xl" alt="" />
                <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} />
                </button>
            </div>
            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
        </div>

        <div className="space-y-6">
            <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-zinc-600 mb-2 ml-1">Имя в профиле</label>
                <input className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:border-white/20 outline-none font-bold" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-zinc-600 mb-2 ml-1">О себе</label>
                <textarea className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:border-white/20 outline-none font-medium resize-none" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
        </div>

        {error && <p className="text-red-500 text-xs font-bold uppercase">{error}</p>}

        <button type="submit" disabled={saving || success} className={`w-full py-5 rounded-[28px] font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-2xl ${success ? 'bg-green-600' : 'bg-white text-black hover:bg-zinc-200'}`}>
          {saving ? 'Сохранение...' : success ? 'Готово' : 'Сохранить изменения'}
        </button>
      </form>
    </div>
  );
};
