import React from 'react';
import { X } from 'lucide-react';
import '../../styles/modalShell.scss';

const ModalShell = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    className = '',
    maxWidth,
}) => {
    if (!isOpen) return null;

    return (
        <div className="app-modal-overlay" onClick={onClose}>
            <div
                className={`app-modal ${className}`.trim()}
                style={maxWidth ? { maxWidth } : undefined}
                onClick={(e) => e.stopPropagation()}
            >
                {(title || onClose) && (
                    <div className="app-modal__header">
                        {title && <h2>{title}</h2>}
                        {onClose && (
                            <button type="button" className="app-modal__close" onClick={onClose} aria-label="Close">
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}
                <div className="app-modal__body">{children}</div>
                {footer && <div className="app-modal__footer">{footer}</div>}
            </div>
        </div>
    );
};

export default ModalShell;
