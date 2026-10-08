import apiClient from './client';

/**
 * Submit a new incident report to the central database.
 * Sends multipart/form-data so evidence photos are uploaded server-side.
 *
 * @param {FormData} formData - includes incidentType, description, location fields and evidence files
 * @returns {Promise<object>} server response with { success, message, report }
 */
export async function createIncident(formData) {
  const response = await apiClient.post('/incidents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Fetch the authenticated ranger's own incident reports from the server.
 *
 * @param {{ page?: number, limit?: number }} params
 * @returns {Promise<object>} { success, total, page, pages, reports }
 */
export async function getMyIncidents(params = {}) {
  const response = await apiClient.get('/incidents/my', { params });
  return response.data;
}
