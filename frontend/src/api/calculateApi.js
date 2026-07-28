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
};

export default calculateApi;
