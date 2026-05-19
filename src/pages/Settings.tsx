import React, { useState } from 'react';
import { Card, Button } from '../components/ui';
import { 
  Lock, 
  Globe, 
  Smartphone, 
  Trash2,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Device state
  const [deviceType, setDeviceType] = useState(user?.user_metadata?.device_type || 'Desktop');
  const [deviceLoading, setDeviceLoading] = useState(false);

  // Language state
  const [language, setLanguage] = useState(user?.user_metadata?.language || 'English (US)');
  const [languageLoading, setLanguageLoading] = useState(false);

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const handleLanguageChange = async (value: string) => {
    setLanguage(value);
    setLanguageLoading(true);
    try {
      await supabase.auth.updateUser({
        data: { language: value }
      });
    } catch (err) {
      console.error('Failed to update language:', err);
    } finally {
      setLanguageLoading(false);
    }
  };

  const handleDeviceChange = async (value: string) => {
    setDeviceType(value);
    setDeviceLoading(true);
    try {
      await supabase.auth.updateUser({
        data: { device_type: value }
      });
    } catch (err) {
      console.error('Failed to update device:', err);
    } finally {
      setDeviceLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }
    
    setPasswordLoading(true);
    setPasswordStatus(null);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      setPasswordStatus({ type: 'success', message: 'Password updated successfully.' });
      setNewPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordStatus(null);
      }, 2000);
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const { error } = await supabase.rpc('delete_user');
      
      if (error) {
        throw new Error(error.message || 'Failed to delete account from server.');
      }
      
      setDeleteSuccess(true);
      
      setTimeout(async () => {
        try {
          await signOut();
        } catch (e) {
          console.error("SignOut mostly failed due to user deletion", e);
        }
        navigate('/login', { replace: true });
      }, 2000);
      
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account.');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Settings</h1>
        <p className="text-[#64748B]">Manage your account preferences and security configuration.</p>
      </div>

      <div className="space-y-6">
        {/* Account Settings */}
        <section>
          <h2 className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-4">Account Preferences</h2>
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-[#E2E8F0]">
              <div className="w-full p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-[#F8FAFC] transition-colors text-left group gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-[#F1F5F9] rounded-lg text-[#64748B] group-hover:text-[#2563EB] transition-colors">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A]">Language</h3>
                    <p className="text-xs text-[#64748B] mt-1">Choose your preferred display language.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select 
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    disabled={languageLoading}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-sm font-medium rounded-lg focus:ring-[#2563EB] focus:border-[#2563EB] block p-2 transition-colors w-full sm:w-auto"
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Portuguese">Portuguese</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                  {languageLoading && (
                    <div className="w-4 h-4 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin ml-2"></div>
                  )}
                </div>
              </div>

              <div className="w-full p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-[#F8FAFC] transition-colors text-left group gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-[#F1F5F9] rounded-lg text-[#64748B] group-hover:text-[#2563EB] transition-colors">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A]">Device</h3>
                    <p className="text-xs text-[#64748B] mt-1">Manage your primary connected device.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select 
                    value={deviceType}
                    onChange={(e) => handleDeviceChange(e.target.value)}
                    disabled={deviceLoading}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-sm font-medium rounded-lg focus:ring-[#2563EB] focus:border-[#2563EB] block p-2 transition-colors w-full sm:w-auto"
                  >
                    <option value="Desktop">Desktop</option>
                    <option value="Android">Android</option>
                    <option value="iOS">iOS</option>
                  </select>
                  {deviceLoading && (
                    <div className="w-4 h-4 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin ml-2"></div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Security Settings */}
        <section>
          <h2 className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-4">Security & Privacy</h2>
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-[#E2E8F0]">
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="w-full p-6 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-[#F1F5F9] rounded-lg text-[#64748B] group-hover:text-[#2563EB] transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A]">Change Password</h3>
                    <p className="text-xs text-[#64748B] mt-1">Update your account security credentials.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#94A3B8]">••••••••</span>
                  <ChevronRight className="w-4 h-4 text-[#CBD5E1]" />
                </div>
              </button>
            </div>
          </Card>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="text-xs font-bold text-[#EF4444] uppercase tracking-widest mb-4">Danger Zone</h2>
          <Card className="border-red-100 bg-red-50/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-[#B91C1C]">Delete Account</h3>
                <p className="text-sm text-[#7F1D1D]/70 mt-1">Permanently remove your account and all earned data.</p>
              </div>
              <Button 
                onClick={() => setShowDeleteModal(true)}
                variant="outline" 
                className="text-[#B91C1C] border-[#FCA5A5] hover:bg-red-50 shrink-0"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Deactivate
              </Button>
            </div>
          </Card>
        </section>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="max-w-md w-full relative shadow-xl border-[#E2E8F0]">
            <button 
              onClick={() => {
                setShowPasswordModal(false);
                setNewPassword('');
                setPasswordStatus(null);
              }}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A]"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-[#0F172A] mb-4">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-sm rounded-lg focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] p-2.5 outline-none transition-all"
                  autoFocus
                />
              </div>
              
              {passwordStatus?.type === 'error' && (
                <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                  <AlertCircle className="w-4 h-4" /> {passwordStatus.message}
                </div>
              )}
              {passwordStatus?.type === 'success' && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> {passwordStatus.message}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={passwordLoading}
                className="w-full h-10 shadow-sm"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="max-w-md w-full relative shadow-xl border-[#E2E8F0]">
            <button 
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteError(null);
              }}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A]"
            >
              <X className="w-5 h-5" />
            </button>
            {deleteSuccess ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-4">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2">Account Deleted</h3>
                <p className="text-sm text-[#64748B]">Your account has been permanently removed. Redirecting...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 text-[#B91C1C] mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">Delete Account?</h3>
                </div>
                
                <p className="text-sm text-[#64748B] leading-relaxed mb-6 font-medium">
                  This action permanently removes your Revonix account and cannot be undone.
                </p>

                {deleteError && (
                  <div className="flex items-start gap-2 text-red-600 text-sm font-medium mb-6 bg-red-50 p-3 rounded-lg border border-red-100">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{deleteError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1F5F9]">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-sm border-none"
                  >
                    {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
