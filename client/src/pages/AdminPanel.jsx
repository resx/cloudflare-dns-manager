import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/authContext';
import toast from 'react-hot-toast';
import { ArrowPathIcon, CheckCircleIcon, ShieldExclamationIcon, WifiIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/apiClient.js';

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
        toast.success('Cloudflare API connection successful!');
      } else {
        toast.error(data.message || t('adminPanel.errors.apiConnectionFailed'));
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(t('adminPanel.errors.networkApiTest'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8">{t('adminPanel.messages.loadingConfig')}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">

        <div className="bg-white p-6 shadow-lg rounded-xl">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{t('adminPanel.cloudflareApiToken.title')}</h2>
          <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-slate-200 text-sm">
            <p className="flex items-center">
              <span className="font-medium text-slate-600 w-28">{t('adminPanel.cloudflareApiToken.status')}:</span>
              {config?.hasApiToken ?
                <span className="font-semibold text-green-600 flex items-center"><CheckCircleIcon className="h-5 w-5 mr-1" />{t('adminPanel.cloudflareApiToken.configured')}</span> :
                <span className="font-semibold text-red-600 flex items-center"><ShieldExclamationIcon className="h-5 w-5 mr-1" />{t('adminPanel.cloudflareApiToken.notConfigured')}</span>
              }
            </p>
            {config?.lastUpdated && (
              <p className="text-xs text-slate-500 mt-2 ml-28">{t('adminPanel.cloudflareApiToken.lastUpdated')}: {new Date(config.lastUpdated).toLocaleString()}</p>
            )}
          </div>

          <form onSubmit={updateApiToken} className="space-y-4">
            <div>
              <label htmlFor="apiToken" className="block text-sm font-medium text-slate-600">{t('adminPanel.cloudflareApiToken.newApiToken')}</label>
              <input type="password" id="apiToken" value={apiToken} onChange={(e) => setApiToken(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t('adminPanel.cloudflareApiToken.newApiTokenPlaceholder')} autoComplete="off" />
            </div>
            <div className="flex items-center space-x-4">
              <button type="submit" disabled={saving || !apiToken} className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ArrowPathIcon className="h-5 w-5" /><span>{saving ? t('adminPanel.buttons.saving') : t('adminPanel.buttons.saveUpdate')}</span>
              </button>
              <button type="button" onClick={testApiConnection} disabled={saving || !config?.hasApiToken} className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <WifiIcon className="h-5 w-5" /><span>{saving ? t('adminPanel.buttons.testing') : t('adminPanel.buttons.testConnection')}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white p-6 shadow-lg rounded-xl">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{t('adminPanel.loginKey.title')}</h2>
          <form onSubmit={updateLoginKey} className="space-y-4">
            {/* Hidden username field for accessibility and to prevent autocomplete on wrong fields */}
            <input type="text" name="username" defaultValue="dns-manager-user" className="hidden" autoComplete="username" />
            <div>
              <label htmlFor="currentKey" className="block text-sm font-medium text-slate-600">{t('adminPanel.loginKey.currentKey')}</label>
              <input type="password" id="currentKey" value={currentKey} onChange={(e) => setCurrentKey(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t('adminPanel.loginKey.currentKeyPlaceholder')} autoComplete="current-password" />
            </div>
            <div>
              <label htmlFor="newKey" className="block text-sm font-medium text-slate-600">{t('adminPanel.loginKey.newKey')}</label>
              <input type="password" id="newKey" value={newKey} onChange={(e) => setNewKey(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t('adminPanel.loginKey.newKeyPlaceholder')} autoComplete="new-password" />
            </div>
            <div>
              <label htmlFor="confirmKey" className="block text-sm font-medium text-slate-600">{t('adminPanel.loginKey.confirmNewKey')}</label>
              <input type="password" id="confirmKey" value={confirmKey} onChange={(e) => setConfirmKey(e.target.value)} className="mt-1 block w-full border border-slate-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder={t('adminPanel.loginKey.confirmNewKeyPlaceholder')} autoComplete="new-password" />
            </div>
            <button type="submit" disabled={saving || !currentKey || !newKey || !confirmKey} className="w-full inline-flex justify-center items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <ShieldExclamationIcon className="h-5 w-5" /><span>{saving ? t('adminPanel.buttons.updating') : t('adminPanel.buttons.updateLoginKey')}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AdminPanel;