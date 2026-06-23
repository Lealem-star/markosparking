export const getLicensePlate = (car) => {
    const plate = car.licensePlate || `${car.plateCode || ''}-${car.region || ''}-${car.licensePlateNumber || ''}`;
    const trimmed = plate.replace(/^-|-$/g, '');
    return trimmed || 'N/A';
};

export const getFormLicenseDisplay = (formData) =>
    `${formData.plateCode}-${formData.region}-${formData.licensePlateNumber}`;
