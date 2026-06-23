import { X } from 'lucide-react';

const AlertBanner = ({ banner, onDismiss }) => {
    if (!banner) return null;

    return (
        <div className={`alert-banner alert-banner-${banner.type}`} role="alert">
            <span className="alert-banner-message">{banner.message}</span>
            <button
                type="button"
                className="alert-banner-dismiss"
                onClick={onDismiss}
                aria-label="Dismiss"
            >
                <X size={18} />
            </button>
        </div>
    );
};

export default AlertBanner;
