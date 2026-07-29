import api from './authApi';

export const calculateApi = {
  convert: (value, fromUnit, toUnit) =>
    api.post('/calculate/convert', { value, fromUnit, toUnit }),

  triangleArea: (sideA, sideB, sideC) =>
    api.post('/calculate/triangle-area', { sideA, sideB, sideC }),

  bighaBreakdown: (areaInSqMetres) =>
    api.post('/calculate/bigha-breakdown', { areaInSqMetres }),

  lengthBreadthBreakdown: (length, breadth) =>
    api.post('/calculate/length-breadth-breakdown', { length, breadth }),

  lengthConvert: (value, fromUnit, toUnit) =>
    api.post('/calculate/length-convert', { value, fromUnit, toUnit }),

  saveHistory: (calculationType, inputData, resultData) =>
    api.post('/calculate/history', { calculationType, inputData, resultData }),

  getHistory: (page = 0, size = 10) =>
    api.get(`/calculate/history?page=${page}&size=${size}`),

  deleteHistoryItem: (id) =>
    api.delete(`/calculate/history/${id}`),
};

export default calculateApi;
