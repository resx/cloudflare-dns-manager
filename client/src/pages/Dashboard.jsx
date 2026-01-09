import React, { useState, useEffect, useCallback } from 'react';
import RecordEditModal from '../components/RecordEditModal';
import toast from 'react-hot-toast';
import { PlusIcon, PencilSquareIcon, TrashIcon, CloudIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/apiClient.js';

const API_BASE_URL = '';

const Dashboard = () => {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();


  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);



  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/dns/zones`);
      if (!response.ok) throw new Error(t('dashboard.errors.fetchZones'));
      const data = await response.json();
      if (data.result) setZones(data.result);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchRecords = useCallback(async (zoneId) => {
    if (!zoneId) return;
    setLoading(true);
    setRecords([]);
    try {
      const response = await apiClient.get(`${API_BASE_URL}/api/dns/zones/${zoneId}/records`);
      if (!response.ok) throw new Error(t('dashboard.errors.fetchRecords'));
      const data = await response.json();
      if (data.result) {
        const transformedRecords = data.result.map(record => {
          if (record.type === 'AAAA' && record.content === '100::') {
            return { ...record, type: 'Worker', content: record.name };
          }
          return record;
        });
        setRecords(transformedRecords);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleZoneChange = (e) => {
    const zoneId = e.target.value;
    setSelectedZone(zoneId);
    fetchRecords(zoneId);
  };

  const handleOpenModal = (record = null) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleSaveRecord = async (formData) => {
    const method = editingRecord ? 'PUT' : 'POST';
    const recordId = editingRecord ? editingRecord.id : '';
    const url = `${API_BASE_URL}/api/dns/zones/${selectedZone}/records/${recordId}`;

    try {
      const response = await apiClient.request(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || t('dashboard.errors.saveRecord'));
      }
      toast.success(t(editingRecord ? 'dashboard.messages.recordUpdated' : 'dashboard.messages.recordCreated'));
      handleCloseModal();
      fetchRecords(selectedZone);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm(t('dashboard.confirmDelete'))) return;

    const url = `${API_BASE_URL}/api/dns/zones/${selectedZone}/records/${recordId}`;

    try {
      const response = await apiClient.delete(url);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || t('dashboard.errors.deleteRecord'));
      }
      toast.success(t('dashboard.messages.recordDeleted'));
      fetchRecords(selectedZone);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleProxy = async (record) => {
    const newProxiedStatus = !record.proxied;
    const url = `${API_BASE_URL}/api/dns/zones/${selectedZone}/records/${record.id}`;

    // Cloudflare API requires sending all relevant fields for PUT requests
    const updatedRecord = {
      type: record.type,
      name: record.name,
      content: record.content,
      ttl: record.ttl,
      proxied: newProxiedStatus,
    };

    try {
      const response = await apiClient.put(url, updatedRecord);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || t('dashboard.errors.toggleProxy'));
      }
      toast.success(t(newProxiedStatus ? 'dashboard.messages.proxiedEnabled' : 'dashboard.messages.proxiedDisabled'));
      fetchRecords(selectedZone);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isProxiedApplicable = (type) => ['A', 'AAAA', 'CNAME'].includes(type);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">{t('nav.dashboard')}</h1>
      <div className="mb-8 flex justify-center">
        <div className="w-full max-w-md">
          <label htmlFor="zone-select" className="block text-sm font-medium text-slate-600 mb-1">{t('dashboard.selectZone')}</label>
          <select id="zone-select" value={selectedZone} onChange={handleZoneChange} className="block w-full p-2 border border-slate-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" disabled={loading}>
            <option value="">{t('dashboard.pleaseSelectZone')}</option>
            {zones.map(zone => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="text-center p-4">Loading records...</div>}

      {selectedZone && !loading && (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">{t('dashboard.recordsTitle')}</h2>
            <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
              <PlusIcon className="h-5 w-5" />
              <span>{t('dashboard.addRecord')}</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.table.type')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.table.name')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.table.content')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.table.ttl')}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('dashboard.table.proxyStatus')}</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">{t('dashboard.table.actions')}</span></th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? records.map((record, recordIdx) => (
                  <tr key={record.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">{record.type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-mono">{record.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 break-all font-mono">{record.content}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{record.ttl === 1 ? 'Automatic' : record.ttl}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {isProxiedApplicable(record.type) ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            value=""
                            className="sr-only peer"
                            checked={record.proxied}
                            onChange={() => handleToggleProxy(record)}
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          <span className="ml-3 text-sm font-medium text-slate-900">
                            {record.proxied ? <CloudIcon className="h-5 w-5 text-indigo-600" /> : <GlobeAltIcon className="h-5 w-5 text-slate-400" />}
                          </span>
                        </label>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <button onClick={() => handleOpenModal(record)} className="text-slate-500 hover:text-indigo-600"><PencilSquareIcon className="h-5 w-5" /></button>
                      <button onClick={() => handleDeleteRecord(record.id)} className="text-slate-500 hover:text-red-600"><TrashIcon className="h-5 w-5" /></button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-slate-500">{t('dashboard.noRecords')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <RecordEditModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        record={editingRecord}
        onSave={handleSaveRecord}
        zoneId={selectedZone}
      />
    </div>
  );
};

export default Dashboard;