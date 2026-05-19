import React, { useState, useEffect } from 'react';
import { Card, Button } from '../ui';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDown, ChevronUp, Save, CheckCircle, AlertCircle, FileText } from 'lucide-react';

const SelectInput = ({ label, name, options, value, onChange }: { label: string, name: string, options: string[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">{label}</label>
    <select 
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] text-sm rounded-lg focus:ring-[#2563EB] focus:border-[#2563EB] block p-2.5 transition-colors"
    >
      <option value="">Select option...</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const TextInput = ({ label, name, type = "text", placeholder = "", value, onChange }: { label: string, name: string, type?: string, placeholder?: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">{label}</label>
    <input 
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] text-sm rounded-lg focus:ring-[#2563EB] focus:border-[#2563EB] block p-2.5 transition-colors"
    />
  </div>
);

export const SurveyBiodata = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  
  const [formData, setFormData] = useState({
    gender: '',
    date_of_birth: '',
    country: 'USA',
    state: '',
    zip_code: '',
    city: '',
    marital_status: '',
    education_level: '',
    employment_status: ''
  });

  useEffect(() => {
    if (!user) return;
    
    const fetchBiodata = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('survey_biodata')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching biodata:', error);
        } else if (data) {
          setFormData({
            ...formData,
            ...data
          });
        }
      } catch (err) {
        console.error('Failed to load survey biodata', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBiodata();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccess(false);
    setError(null);
  };

  const calculateAge = (dob: string) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSuccess(false);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('survey_biodata')
        .upsert({
          user_id: user.id,
          ...formData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save biodata. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center bg-[#F8FAFC]">
        <div className="animate-spin w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-sm font-medium text-[#64748B]">Loading your survey profile...</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-[#E2E8F0] shadow-sm">
      <div 
        className="p-6 sm:p-8 border-b border-[#F1F5F9] cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-[#0F172A] text-lg">Survey Qualification Profile</h3>
            <p className="text-xs text-[#64748B] font-medium mt-0.5 max-w-lg">
              Your survey biodata helps match you with higher quality USA survey opportunities. All fields are optional.
            </p>
          </div>
        </div>
        <div>
          {isOpen ? <ChevronUp className="w-5 h-5 text-[#94A3B8]" /> : <ChevronDown className="w-5 h-5 text-[#94A3B8]" />}
        </div>
      </div>
      
      {isOpen && (
        <div className="p-6 sm:p-8 space-y-10">
          
          {/* Demographics Group */}
          <div>
            <h4 className="text-sm font-bold text-[#1E293B] mb-5 pb-2 border-b border-[#F1F5F9]">Basic Demographics</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <SelectInput label="Gender" name="gender" options={["Male", "Female", "Non-binary", "Prefer not to say"]} value={formData.gender} onChange={handleChange} />
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Date of Birth</label>
                <div className="flex gap-2">
                  <input 
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="flex-1 bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a] text-sm rounded-lg focus:ring-[#2563EB] focus:border-[#2563EB] block p-2.5 transition-colors"
                  />
                  <div className="bg-[#F1F5F9] border border-[#e2e8f0] rounded-lg px-3 flex items-center justify-center text-xs font-semibold text-[#64748B] whitespace-nowrap">
                    {calculateAge(formData.date_of_birth) ? `${calculateAge(formData.date_of_birth)} yrs` : 'Age'}
                  </div>
                </div>
              </div>
              <TextInput label="Country" name="country" placeholder="USA" value={formData.country} onChange={handleChange} />
              <SelectInput label="State" name="state" options={["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"]} value={formData.state} onChange={handleChange} />
              <TextInput label="ZIP Code" name="zip_code" value={formData.zip_code} onChange={handleChange} />
              <TextInput label="City" name="city" placeholder="e.g. New York" value={formData.city} onChange={handleChange} />
            </div>
          </div>

          {/* Personal Info Group */}
          <div>
            <h4 className="text-sm font-bold text-[#1E293B] mb-5 pb-2 border-b border-[#F1F5F9]">Personal Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <SelectInput label="Marital Status" name="marital_status" options={["Single", "Married", "Divorced", "Widowed", "Domestic Partnership"]} value={formData.marital_status} onChange={handleChange} />
              <SelectInput label="Education Level" name="education_level" options={["High School", "Some College", "Associate Degree", "Bachelor's Degree", "Master's Degree", "Doctorate", "Prefer not to answer"]} value={formData.education_level} onChange={handleChange} />
              <SelectInput label="Employment Status" name="employment_status" options={["Employed Full-Time", "Employed Part-Time", "Self-Employed", "Unemployed", "Student", "Retired", "Homemaker"]} value={formData.employment_status} onChange={handleChange} />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-4">
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm font-medium mr-auto">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            
            {success && (
              <div className="flex items-center gap-2 text-green-600 text-sm font-bold px-4 py-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                Biodata Saved Successfully
              </div>
            )}
            
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full sm:w-auto h-10 shadow-sm"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Qualification Profile
                </>
              )}
            </Button>
          </div>
          
        </div>
      )}
    </Card>
  );
};
