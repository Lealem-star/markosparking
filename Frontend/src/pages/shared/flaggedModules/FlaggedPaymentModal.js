import ChapaPaymentModal from '../../../components/payment/ChapaPaymentModal';
import { getLicensePlate } from './flaggedUtils';

const FlaggedPaymentModal = (props) => {
    const { t, isOpen, selectedCar, feeDetails, loading, onClose } = props;

    return (
        <ChapaPaymentModal
            t={t}
            isOpen={isOpen && !!selectedCar && !!feeDetails}
            loading={loading}
            onClose={onClose}
            totalAmount={feeDetails?.totalWithVat}
            phoneNumber={selectedCar?.phoneNumber}
            licensePlate={selectedCar ? getLicensePlate(selectedCar) : undefined}
        />
    );
};

export default FlaggedPaymentModal;
