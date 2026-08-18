'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import Card, { CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { User, CreditCard, Shield, Save } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  name: string;
  role: string;
  company?: {
    id: string;
    name: string;
    description?: string;
    website?: string;
    stripeAccountId?: string;
    verified: boolean;
  };
  researcher?: {
    id: string;
    bio?: string;
    avatarUrl?: string;
    githubUrl?: string;
    reputation: number;
    totalEarnings: number;
  };
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingUpPayments, setSettingUpPayments] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatarUrl: '',
    githubUrl: '',
  });

  const [companyData, setCompanyData] = useState({
    description: '',
    website: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.get<Profile>('/api/users/profile');
      setProfile(data);
      setFormData({
        name: data.name || '',
        bio: data.researcher?.bio || '',
        avatarUrl: data.researcher?.avatarUrl || '',
        githubUrl: data.researcher?.githubUrl || '',
      });
      if (data.company) {
        setCompanyData({
          description: data.company.description || '',
          website: data.company.website || '',
        });
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put('/api/users/profile', formData);
      toast.success('Profile updated successfully');
      loadProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSetupPayments = async () => {
    setSettingUpPayments(true);

    try {
      const { url } = await api.post<{ url: string }>('/api/users/setup-payments', {});
      window.location.href = url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to setup payments');
    } finally {
      setSettingUpPayments(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const isCompany = user?.role === 'COMPANY';
  const isResearcher = user?.role === 'RESEARCHER';

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Profile Settings */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold">Profile Settings</h2>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
              <Input
                label="Email"
                value={profile?.email || ''}
                disabled
                className="bg-gray-50"
              />
            </div>

            {isResearcher && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell companies about your expertise..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Avatar URL"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <Input
                    label="GitHub URL"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    placeholder="https://github.com/username"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Reputation Score</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {profile?.researcher?.reputation || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Earnings</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        ${(profile?.researcher?.totalEarnings || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {isCompany && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    value={companyData.description}
                    onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                    placeholder="Describe your company..."
                  />
                </div>

                <Input
                  label="Website"
                  value={companyData.website}
                  onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                  placeholder="https://yourcompany.com"
                />

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">Verification Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      profile?.company?.verified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {profile?.company?.verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end">
              <Button type="submit" loading={saving}>
                <Save size={16} className="mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Payment Settings (Company only) */}
      {isCompany && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold">Payment Settings</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Connect your Stripe account to receive payments and fund bounties.
              </p>

              {profile?.company?.stripeAccountId ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-emerald-400 rounded-full" />
                    <span className="font-medium text-emerald-300">Stripe Account Connected</span>
                  </div>
                  <p className="text-sm text-emerald-300/80 mt-1">
                    Your account is ready to receive payments.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <p className="text-yellow-300">
                    You haven't connected a Stripe account yet. Connect to start funding bounties.
                  </p>
                </div>
              )}

              <Button
                onClick={handleSetupPayments}
                loading={settingUpPayments}
                variant={profile?.company?.stripeAccountId ? 'secondary' : 'primary'}
              >
                <CreditCard size={16} className="mr-2" />
                {profile?.company?.stripeAccountId ? 'Update Stripe Account' : 'Connect Stripe'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Info */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Account Information</h2>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Account Type</dt>
              <dd className="font-medium">{profile?.role}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium">{profile?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Member Since</dt>
              <dd className="font-medium">January 2024</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
