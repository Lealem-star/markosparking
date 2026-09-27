import { getFormLicenseDisplay, getLicensePlate } from './carDisplay';

export const buildCheckoutSmsMessage = (car, feeDetails) => {
    const licenseDisplay = getLicensePlate(car);

    if (car.serviceType === 'package' && car.packageDuration) {
        let remainingDaysText = '';
        if (car.packageEndDate) {
            const now = new Date();
            const end = new Date(car.packageEndDate);
            const diffMs = end.getTime() - now.getTime();
            const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            remainingDaysText = `Package expires on ${end.toLocaleDateString()} (${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining).`;
        }
        return `Thank you for using Markos Parking services!\nYour package car (${licenseDisplay}) has checked out.\nPackage type: ${car.packageDuration}.\n${remainingDaysText}`;
    }

    const totalMinutes = Math.round(feeDetails.hoursParked * 60);
    const durationDisplay = totalMinutes >= 60
        ? `${Math.floor(totalMinutes / 60)} hour${Math.floor(totalMinutes / 60) > 1 ? 's' : ''}${totalMinutes % 60 > 0 ? ` ${totalMinutes % 60} min` : ''}`.trim()
        : `${totalMinutes} min`;

    return `Thank you for using Markos Parking services! Your car (${licenseDisplay}) has been received.\nParking fee: ${feeDetails.parkingFee.toFixed(2)} ETB\nVAT (15%): ${feeDetails.vatAmount.toFixed(2)} ETB\nTotal: ${feeDetails.totalWithVat.toFixed(2)} ETB (${durationDisplay} × ${feeDetails.pricePerHour} ETB/hour).\nPayment method: Online Payment.`;
};

export const buildHourlyRegistrationSms = (formData) => {
    const now = new Date();
    const parkingTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const parkingDate = now.toLocaleDateString();

    return `Dear customer,\nyour car (Plate Code: ${formData.plateCode}, License Plate Number: ${formData.licensePlateNumber}, Model: ${formData.model}) is now parked at Markos parking.\nParking started at ${parkingTime} on ${parkingDate}.\nThank you!`;
};

export const buildPackageActivationSms = (formData, carInfo, validatedDuration, totalWithVat) => {
    const packageDurationLabel = carInfo?.packageDuration || validatedDuration;
    const licenseDisplay = getFormLicenseDisplay(formData);

    let remainingDaysText = '';
    if (carInfo?.packageEndDate) {
        const now = new Date();
        const end = new Date(carInfo.packageEndDate);
        const diffMs = end.getTime() - now.getTime();
        const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        remainingDaysText = `Package expires on ${end.toLocaleDateString()} (${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining).`;
    }

    return `Dear customer,\nYour ${packageDurationLabel} parking package at Markos Parking is now active for car (Plate: ${licenseDisplay}, Model: ${formData.model}).\n${remainingDaysText}\nTotal paid: ${totalWithVat.toFixed(2)} ETB.\nThank you!`;
};

export const formatChapaPaymentFailureMessage = (error, phoneNumber = 'N/A') => {
    let errorMessage = error?.message
        || (typeof error === 'string' ? error : 'Payment failed. Please try again.');

    const errorMsgLower = errorMessage.toLowerCase();
    if (
        errorMsgLower.includes('invalid test number')
        || errorMsgLower.includes('invalid otp')
        || errorMsgLower.includes('payment method')
    ) {
        let helpText = '\n\n⚠️ TEST MODE REQUIREMENTS:\n';
        helpText += `• Phone number used: ${phoneNumber}\n`;
        helpText += '• Valid test numbers:\n';
        helpText += '  - telebirr/cbebirr/ebirr: 0900112233, 0900123456, 0900881111\n';
        helpText += '  - mpesa: 0700112233, 0700123456, 0700881111\n';
        helpText += '• Make sure the payment method matches the phone number prefix:\n';
        helpText += '  - 09xxx = telebirr/cbebirr/ebirr\n';
        helpText += '  - 07xxx = mpesa\n';
        helpText += '• Check your Chapa dashboard to ensure payment methods are enabled for test mode';
        errorMessage += helpText;
    }

    return errorMessage;
};

export const CHAPA_PAY_BUTTON_STYLES = `
    .chapa-pay-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 16px 24px;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        width: 100%;
        transition: all 0.3s ease;
    }
    .chapa-pay-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }
`;
