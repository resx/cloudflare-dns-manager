import React, { useState, useEffect, useCallback } from 'react';
import RecordEditModal from '../components/RecordEditModal';
import toast from 'react-hot-toast';
import { PlusIcon, PencilSquareIcon, TrashIcon, CloudIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import apiClient from '../services/apiClient.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select.jsx';
import { Button } from '../components/ui/button.jsx';
import FadeIn from '../components/animated/fade-in.jsx';
import BlurText from '../components/animated/blur-text.jsx';
import ShimmerButton from '../components/animated/shimmer-button.jsx';
import NumberTicker from '../components/animated/number-ticker.jsx';

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
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="mb-8">
        <BlurText text={t('nav.dashboard')} className="text-3xl font-bold mb-2" />
        {records.length > 0 && (
          <p className="text-muted-foreground flex items-center gap-2">
            Total Records: <NumberTicker value={records.length} className="font-semibold text-primary" />
          </p>
        )}
      </div>

      <FadeIn delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.selectZone')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedZone} onValueChange={(value) => {
              setSelectedZone(value);
              fetchRecords(value);
            }} disabled={loading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('dashboard.pleaseSelectZone')} />
              </SelectTrigger>
              <SelectContent>
                {zones.map(zone => (
                  <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </FadeIn>

      {loading && <div className="text-center p-8 text-muted-foreground">Loading records...</div>}

      {selectedZone && !loading && (
        <FadeIn delay={0.2}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>{t('dashboard.recordsTitle')}</CardTitle>
              <ShimmerButton onClick={() => handleOpenModal()}>
                <PlusIcon className="h-5 w-5 mr-2" />
                {t('dashboard.addRecord')}
              </ShimmerButton>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dashboard.table.type')}</TableHead>
                    <TableHead>{t('dashboard.table.name')}</TableHead>
                    <TableHead>{t('dashboard.table.content')}</TableHead>
                    <TableHead>{t('dashboard.table.ttl')}</TableHead>
                    <TableHead>{t('dashboard.table.proxyStatus')}</TableHead>
                    <TableHead className="text-right">{t('dashboard.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length > 0 ? records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Badge>{record.type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">{record.name}</TableCell>
                      <TableCell className="font-mono text-muted-foreground break-all">{record.content}</TableCell>
                      <TableCell>{record.ttl === 1 ? 'Automatic' : record.ttl}</TableCell>
                      <TableCell>
                        {isProxiedApplicable(record.type) ? (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={record.proxied}
                              onChange={() => handleToggleProxy(record)}
                            />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border after:border-border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            <span className="ml-3">
                              {record.proxied ? <CloudIcon className="h-5 w-5 text-primary" /> : <GlobeAltIcon className="h-5 w-5 text-muted-foreground" />}
                            </span>
                          </label>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenModal(record)}
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRecord(record.id)}
                            className="hover:text-destructive"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        {t('dashboard.noRecords')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </FadeIn>
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