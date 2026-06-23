import ModalShell from '../../../components/ui/ModalShell';

const DeletePriceLevelModal = ({ t, isOpen, priceLevelName, loading, onCancel, onConfirm }) => (
    <ModalShell
        isOpen={isOpen}
        onClose={onCancel}
        title={t('settings.deletePriceLevel')}
        className="app-modal--danger"
        footer={
            <>
                <button type="button" className="btn-cancel" onClick={onCancel}>
                    Cancel
                </button>
                <button type="button" className="btn-delete-confirm" onClick={onConfirm} disabled={loading}>
                    {loading ? t('settings.deleting') : t('common.delete')}
                </button>
            </>
        }
    >
        <p>
            {t('settings.deleteConfirmation')} <strong>&quot;{priceLevelName}&quot;</strong>?
        </p>
        <p className="warning-text">{t('settings.cannotBeUndone')}</p>
    </ModalShell>
);

export default DeletePriceLevelModal;
