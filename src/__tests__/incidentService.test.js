jest.mock('../api/incidents', () => ({
  createIncident: jest.fn(),
}));

jest.mock('../services/IncidentStorage', () => ({
  saveIncident: jest.fn(),
  SyncStatus: { PENDING_SYNC: 'PENDING_SYNC', SYNCHRONIZED: 'SYNCHRONIZED' },
}));

jest.mock('../services/SyncManager', () => ({
  checkConnectivity: jest.fn(),
  storeOffline: jest.fn(),
  synchronizeData: jest.fn(),
}));

import { createIncident } from '../api/incidents';
import { saveIncident, SyncStatus } from '../services/IncidentStorage';
import { checkConnectivity } from '../services/SyncManager';
import {
  validateIncident,
  generateClientIncidentId,
  submitIncident,
  INCIDENT_TYPES,
} from '../services/incidentService';

const baseData = () => ({
  incidentType: 'POACHING',
  description: 'Poachers found with traps near river',
  location: {
    latitude: 7.8731,
    longitude: 80.7718,
    timestamp: new Date().toISOString(),
    source: 'GPS',
  },
  evidencePhotos: [{ uri: 'file://p.jpg', type: 'image/jpeg', name: 'p.jpg' }],
});

describe('incidentService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('generateClientIncidentId', () => {
    it('generates a UUID v4 format string', () => {
      const id = generateClientIncidentId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('generates unique IDs each time', () => {
      const ids = new Set(Array.from({ length: 20 }, generateClientIncidentId));
      expect(ids.size).toBe(20);
    });
  });

  describe('INCIDENT_TYPES', () => {
    it('contains all expected types', () => {
      expect(INCIDENT_TYPES).toContain('POACHING');
      expect(INCIDENT_TYPES).toContain('SNARE');
      expect(INCIDENT_TYPES).toContain('ANIMAL_CARCASS');
    });
  });

  describe('validateIncident', () => {
    it('passes for fully valid data', () => {
      const { valid } = validateIncident(baseData());
      expect(valid).toBe(true);
    });

    it('fails when incidentType missing', () => {
      const { valid, missingFields } = validateIncident({ ...baseData(), incidentType: '' });
      expect(valid).toBe(false);
      expect(missingFields).toContain('incidentType');
    });

    it('fails when description missing', () => {
      const { valid, missingFields } = validateIncident({ ...baseData(), description: '' });
      expect(valid).toBe(false);
      expect(missingFields).toContain('description');
    });

    it('fails when no evidence photos', () => {
      const { valid, missingFields } = validateIncident({ ...baseData(), evidencePhotos: [] });
      expect(valid).toBe(false);
      expect(missingFields).toContain('evidencePhotos');
    });

    it('fails when location is missing', () => {
      const { valid, missingFields } = validateIncident({ ...baseData(), location: null });
      expect(valid).toBe(false);
      expect(missingFields).toContain('location');
    });

    it('fails when latitude out of range', () => {
      const data = { ...baseData(), location: { ...baseData().location, latitude: 100 } };
      const { valid, missingFields } = validateIncident(data);
      expect(valid).toBe(false);
      expect(missingFields).toContain('location');
    });

    it('returns all missing fields together', () => {
      const { missingFields } = validateIncident({});
      expect(missingFields).toContain('incidentType');
      expect(missingFields).toContain('description');
      expect(missingFields).toContain('evidencePhotos');
    });
  });

  describe('submitIncident', () => {
    it('saves locally and submits to server when online, returns SYNCHRONIZED', async () => {
      saveIncident.mockResolvedValue();
      checkConnectivity.mockResolvedValue(true);
      createIncident.mockResolvedValue({ success: true });

      const result = await submitIncident(baseData());

      expect(saveIncident).toHaveBeenCalled();
      expect(createIncident).toHaveBeenCalled();
      expect(result.syncStatus).toBe(SyncStatus.SYNCHRONIZED);
      expect(result.clientIncidentId).toBeDefined();
    });

    it('returns PENDING_SYNC when offline', async () => {
      saveIncident.mockResolvedValue();
      checkConnectivity.mockResolvedValue(false);

      const result = await submitIncident(baseData());

      expect(createIncident).not.toHaveBeenCalled();
      expect(result.syncStatus).toBe(SyncStatus.PENDING_SYNC);
    });

    it('returns SYNCHRONIZED on 409 (already submitted)', async () => {
      saveIncident.mockResolvedValue();
      checkConnectivity.mockResolvedValue(true);
      const err = Object.assign(new Error('Conflict'), { response: { status: 409 } });
      createIncident.mockRejectedValue(err);

      const result = await submitIncident(baseData());

      expect(result.syncStatus).toBe(SyncStatus.SYNCHRONIZED);
    });

    it('returns PENDING_SYNC when network fails mid-request', async () => {
      saveIncident.mockResolvedValue();
      checkConnectivity.mockResolvedValue(true);
      createIncident.mockRejectedValue(new Error('Network error'));

      const result = await submitIncident(baseData());

      expect(result.syncStatus).toBe(SyncStatus.PENDING_SYNC);
    });

    it('throws with missingFields when client validation fails', async () => {
      await expect(submitIncident({ incidentType: 'POACHING' })).rejects.toMatchObject({
        missingFields: expect.arrayContaining(['description']),
      });
      expect(saveIncident).not.toHaveBeenCalled();
    });

    it('reuses provided clientIncidentId instead of generating a new one', async () => {
      saveIncident.mockResolvedValue();
      checkConnectivity.mockResolvedValue(true);
      createIncident.mockResolvedValue({ success: true });

      const data = { ...baseData(), clientIncidentId: 'my-custom-id' };
      const result = await submitIncident(data);

      expect(result.clientIncidentId).toBe('my-custom-id');
    });
  });
});
