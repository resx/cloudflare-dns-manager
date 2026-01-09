import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/authContext';
import toast from 'react-hot-toast';
import { ArrowPathIcon, CheckCircleIcon, ShieldExclamationIcon, WifiIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/apiClient.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';
import FadeIn from '../components/animated/fade-in.jsx';
import BlurText from '../components/animated/blur-text.jsx';

const API_BASE_URL = '';

const AdminPanel = () => {
  const { logout } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();

  const [apiToken, setApiToken] = useState('');
  const [currentKey, setCurrentKey] = useState('');
  const [newKey, setNewKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');

  const fetchConfig = useCallback(async () => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/config`);
      if (response.ok) {
        setConfig(await response.json());
      } else {
        toast.error(t('adminPanel.errors.loadConfig'));
      }
    } catch (err) {
      toast.error(t('adminPanel.errors.networkConfig'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateApiToken = async (e) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading(t('adminPanel.messages.updatingApiToken'));
    try {
      const response = await apiClient.put(`${API_BASE_URL}/api/config/cloudflare-token`, { apiToken });
      toast.dismiss(toastId);
      if (response.ok) {
        toast.success(t('adminPanel.messages.apiTokenUpdated'));
        setApiToken('');
        fetchConfig();
      } else {
        const data = await response.json();
        toast.error(data.error || t('adminPanel.errors.updateApiToken'));
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(t('adminPanel.errors.network'));
    } finally {
      setSaving(false);
    }
  };

  const updateLoginKey = async (e) => {
    e.preventDefault();
    if (newKey !== confirmKey) {
      toast.error(t('adminPanel.errors.keysMismatch'));
      return;
    }
    setSaving(true);
    const toastId = toast.loading(t('adminPanel.messages.updatingLoginKey'));
    try {
      const response = await apiClient.put(`${API_BASE_URL}/api/config/login-key`, { currentKey, newKey });
      toast.dismiss(toastId);
      if (response.ok) {
        toast.success(t('adminPanel.messages.loginKeyUpdated'));
        setCurrentKey('');
        setNewKey('');
        setConfirmKey('');
        setTimeout(() => logout(), 2000);
      } else {
        const data = await response.json();
        toast.error(data.error || t('adminPanel.errors.updateLoginKey'));
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(t('adminPanel.errors.network'));
    } finally {
      setSaving(false);
    }
  };

  const testApiConnection = async () => {
    setSaving(true);
    const toastId = toast.loading(t('adminPanel.messages.testingApiConnection'));
    try {
      const response = await apiClient.post(`${API_BASE_URL}/api/config/test-cloudflare`);
      const data = await response.json();
      toast.dismiss(toastId);
      if (data.success) {
        toast.success(t('adminPanel.messages.apiConnectionSuccess'));
      } else {
        toast.error(data.error || t('adminPanel.errors.apiConnectionFailed'));
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(t('adminPanel.errors.network'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('adminPanel.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="mb-8">
        <BlurText text={t('nav.adminPanel')} className="text-3xl font-bold mb-2" />
        <p className="text-muted-foreground">{t('adminPanel.description')}</p>
      </div>

      {/* API Token Configuration */}
      <FadeIn delay={0.1}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <WifiIcon className="h-6 w-6 text-primary" />
              <CardTitle>{t('adminPanel.cloudflareApiToken')}</CardTitle>
            </div>
            <CardDescription>{t('adminPanel.apiTokenDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config?.cloudflareToken && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span className="text-sm">{t('adminPanel.apiTokenConfigured')}</span>
                <Badge variant="secondary" className="ml-auto">
                  {t('adminPanel.configured')}
                </Badge>
              </div>
            )}

            <form onSubmit={updateApiToken} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiToken">{t('adminPanel.newApiToken')}</Label>
                <Input
                  id="apiToken"
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder={t('adminPanel.enterApiToken')}
                  required
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving || !apiToken}>
                  {saving ? t('adminPanel.updating') : t('adminPanel.updateApiToken')}
                </Button>
                {config?.cloudflareToken && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={testApiConnection}
                    disabled={saving}
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    {t('adminPanel.testConnection')}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Login Key Configuration */}
      <FadeIn delay={0.2}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldExclamationIcon className="h-6 w-6 text-primary" />
              <CardTitle>{t('adminPanel.changeLoginKey')}</CardTitle>
            </div>
            <CardDescription>{t('adminPanel.loginKeyDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateLoginKey} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentKey">{t('adminPanel.currentLoginKey')}</Label>
                <Input
                  id="currentKey"
                  type="password"
                  value={currentKey}
                  onChange={(e) => setCurrentKey(e.target.value)}
                  placeholder={t('adminPanel.enterCurrentKey')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newKey">{t('adminPanel.newLoginKey')}</Label>
                <Input
                  id="newKey"
                  type="password"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder={t('adminPanel.enterNewKey')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmKey">{t('adminPanel.confirmNewKey')}</Label>
                <Input
                  id="confirmKey"
                  type="password"
                  value={confirmKey}
                  onChange={(e) => setConfirmKey(e.target.value)}
                  placeholder={t('adminPanel.confirmNewKey')}
                  required
                />
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ {t('adminPanel.keyChangeWarning')}
                </p>
              </div>

              <Button
                type="submit"
                variant="destructive"
                disabled={saving || !currentKey || !newKey || !confirmKey}
              >
                {saving ? t('adminPanel.updating') : t('adminPanel.updateLoginKey')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
};

export default AdminPanel;