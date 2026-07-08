import React, { useMemo, useState } from 'react';
import { deactivateUserRecord, createUserRecord, updateUserRecord } from '../../api/api';
import { getApiError } from '../../api/client';
import { useCurrentUser } from '../../hooks/useAuth';
import { useUsersQuery, useParkZonesQuery, useInvalidateUsers } from '../../hooks/queries';
import { useTranslation } from 'react-i18next';
import { DeleteModal } from '../../components';
import { Shield, Car } from 'lucide-react';
import { canCreateUsers, requiresZoneCode, ROLES, isAllZonesCode, getSupervisorZoneList } from '../../constants/roles';
import { getStaffManagementMode } from '../../config/staffAccess';
import {
    StaffStatCards,
    StaffFilterBar,
    StaffTable,
    ZoneAccordion,
    UserFormModal,
    filterStaff,
    getStaffStats,
    getUniqueZones,
    groupValetsByZone,
    isManagerial,
    filterUsersForStaffMode,
    resolveParkZoneCode,
    getPriceLevelForParkZone,
} from './staffManagement';
import '../../styles/userManagement.scss';

const EMPTY_FORM = {
    name: '',
    phoneNumber: '',
    password: '',
    type: '',
    parkZoneCode: '',
};

const UserManagement = () => {
    const { t } = useTranslation();
    const [selectedUser, setSelectedUser] = useState();
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [zoneFilter, setZoneFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const user = useCurrentUser();
    const invalidateUsers = useInvalidateUsers();
    const { data: users = [] } = useUsersQuery(user?.token);
    const { data: parkZones = [] } = useParkZonesQuery(user?.token);

    const refreshUsers = () => invalidateUsers();

    const staffMode = getStaffManagementMode(user?.type);
    const scopedUsers = useMemo(
        () => filterUsersForStaffMode(users, user, staffMode),
        [users, user, staffMode]
    );

    const filteredUsers = useMemo(
        () => filterStaff(scopedUsers, { searchQuery, roleFilter, zoneFilter, statusFilter }),
        [scopedUsers, searchQuery, roleFilter, zoneFilter, statusFilter]
    );

    const stats = useMemo(() => {
        const base = getStaffStats(scopedUsers);
        return {
            totalStaff: base.total,
            officeStaff: base.officeStaff,
            valets: base.valets,
            activeZones: base.zones,
        };
    }, [scopedUsers]);
    const zones = useMemo(() => getUniqueZones(users, parkZones), [users, parkZones]);
    const managerialStaff = useMemo(
        () => filteredUsers.filter(isManagerial),
        [filteredUsers]
    );
    const valetsByZone = useMemo(
        () => groupValetsByZone(filteredUsers.filter((u) => u?.type === 'valet')),
        [filteredUsers]
    );

    const canCreateUsersFlag = canCreateUsers(user?.type);
    const showOfficeStaffSection = staffMode === 'full';
    const supervisorZoneScoped = staffMode === 'supervisor' && getSupervisorZoneList(user?.parkZoneCode).length === 1;

    const validateZoneAssignment = () => {
        if (!requiresZoneCode(formData.type)) {
            return true;
        }

        if (formData.type === ROLES.SUPERVISOR) {
            if (isAllZonesCode(formData.parkZoneCode) || getSupervisorZoneList(formData.parkZoneCode).length > 0) {
                return true;
            }
            setError(t('admin.supervisorZoneRequired'));
            return false;
        }

        if (!formData.parkZoneCode) {
            setError('Park Zone Code is required for this role');
            return false;
        }

        if (formData.type === ROLES.VALET && (isAllZonesCode(formData.parkZoneCode) || formData.parkZoneCode.includes(','))) {
            setError('Valets must be assigned to a specific park zone');
            return false;
        }

        if (formData.type === ROLES.VALET && formData.parkZoneCode) {
            const zoneCode = resolveParkZoneCode(formData.parkZoneCode, parkZones);
            if (!getPriceLevelForParkZone(zoneCode, parkZones)) {
                setError(t('admin.zoneMissingPriceLevel'));
                return false;
            }
        }

        return true;
    };

    const handleFormChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        setError('');
        setSuccess('');
    };

    const resetForm = () => {
        setFormData(EMPTY_FORM);
        setEditingUser(null);
    };

    const handleCreateUser = () => {
        setError('');
        setSuccess('');

        if (!formData.name || !formData.phoneNumber || !formData.password || !formData.type) {
            setError('All fields are required');
            return;
        }

        if (!validateZoneAssignment()) return;

        createUserRecord(formData, user?.token)
            .then(handleCreateUserSuccess)
            .catch((err) => handleCreateUserFailure(getApiError(err)));
    };

    const handleCreateUserSuccess = () => {
        setSuccess('User created successfully!');
        resetForm();
        refreshUsers();
        setTimeout(() => {
            setShowCreateModal(false);
            setSuccess('');
        }, 2000);
    };

    const handleCreateUserFailure = (failureError) => {
        if (typeof failureError === 'string') {
            setError(failureError);
            return;
        }
        setError(failureError?.message || failureError?.error || 'Failed to create user');
    };

    const handleDeactivate = (userToDeactivate) => {
        setSelectedUser(userToDeactivate);
        setError('');
        setShowDeactivateModal(true);
    };

    const handleDeactivateUser = async () => {
        try {
            await deactivateUserRecord(selectedUser?._id, user?.token);
            handleDeactivateUserSuccess();
        } catch (err) {
            handleDeactivateUserFailure(getApiError(err));
        }
    };

    const handleDeactivateUserSuccess = () => {
        setSuccess('User deactivated successfully!');
        refreshUsers();
        setShowDeactivateModal(false);
        setTimeout(() => setSuccess(''), 2000);
    };

    const handleDeactivateUserFailure = (failureError) => {
        setError(typeof failureError === 'string' ? failureError : failureError?.message || 'Failed to deactivate user');
        setShowDeactivateModal(false);
    };

    const handleReactivate = async (userToReactivate) => {
        setError('');
        setSuccess('');

        try {
            await updateUserRecord(userToReactivate?._id, { isActive: true }, user?.token);
            setSuccess(`${userToReactivate?.name} reactivated successfully!`);
            refreshUsers();
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError(getApiError(err, 'Failed to reactivate user'));
        }
    };

    const handleEdit = (userToEdit) => {
        setEditingUser(userToEdit);
        setFormData({
            name: userToEdit?.name || '',
            phoneNumber: userToEdit?.phoneNumber || '',
            password: '',
            type: userToEdit?.type || '',
            parkZoneCode: userToEdit?.type === ROLES.VALET
                ? resolveParkZoneCode(userToEdit?.parkZoneCode, parkZones)
                : userToEdit?.parkZoneCode || '',
        });
        setError('');
        setSuccess('');
        setShowEditModal(true);
    };

    const handleUpdateUser = () => {
        setError('');
        setSuccess('');

        if (!formData.name || !formData.phoneNumber || !formData.type) {
            setError('Name, phone number, and type are required');
            return;
        }

        if (!validateZoneAssignment()) return;

        const updateBody = {
            name: formData.name,
            phoneNumber: formData.phoneNumber,
            type: formData.type,
            parkZoneCode: formData.parkZoneCode || undefined,
        };

        if (formData.password) {
            updateBody.password = formData.password;
        }

        updateUserRecord(editingUser?._id, updateBody, user?.token)
            .then(handleUpdateUserSuccess)
            .catch((err) => handleUpdateUserFailure(getApiError(err)));
    };

    const handleUpdateUserSuccess = () => {
        setSuccess('User updated successfully!');
        resetForm();
        refreshUsers();
        setTimeout(() => {
            setShowEditModal(false);
            setSuccess('');
        }, 2000);
    };

    const handleUpdateUserFailure = (failureError) => {
        setError(typeof failureError === 'string' ? failureError : failureError?.message || failureError?.error || 'Failed to update user');
    };

    return (
        <div className="user-management user-management--v2">
            <div className="staff-page-header">
                <h1>{t('admin.userManagement')}</h1>
            </div>

            {success && <div className="alert alert-success">{success}</div>}
            {error && !showCreateModal && !showEditModal && (
                <div className="alert alert-danger">{error}</div>
            )}

            <StaffStatCards stats={stats} t={t} />

            <StaffFilterBar
                t={t}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                roleFilter={roleFilter}
                onRoleChange={setRoleFilter}
                zoneFilter={zoneFilter}
                onZoneChange={setZoneFilter}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                zones={zones}
                canCreateUsers={canCreateUsersFlag}
                onAddStaff={() => {
                    resetForm();
                    setShowCreateModal(true);
                }}
            />

            {showOfficeStaffSection && (
            <section className="staff-section-card">
                <header className="staff-section-header">
                    <Shield size={20} />
                    <h2>{t('admin.officeStaff')}</h2>
                    <span className="staff-section-count">{managerialStaff.length}</span>
                </header>
                <StaffTable
                    staffList={managerialStaff}
                    t={t}
                    onEdit={handleEdit}
                    onDeactivate={handleDeactivate}
                    onReactivate={handleReactivate}
                    emptyMessage={t('admin.noOfficeStaff')}
                />
            </section>
            )}

            <section className="staff-section-card">
                <header className="staff-section-header">
                    <Car size={20} />
                    <h2>{supervisorZoneScoped ? t('admin.valetsInYourZone') : t('admin.valetStaffByZones')}</h2>
                </header>
                <ZoneAccordion
                    zones={valetsByZone}
                    t={t}
                    managerialCount={managerialStaff.length}
                    onEdit={handleEdit}
                    onDeactivate={handleDeactivate}
                    onReactivate={handleReactivate}
                />
            </section>

            <UserFormModal
                isOpen={showCreateModal}
                title="Create New User"
                formData={formData}
                parkZones={parkZones}
                zones={zones}
                error={error}
                actorType={user?.type}
                onClose={() => setShowCreateModal(false)}
                onChange={handleFormChange}
                onSubmit={handleCreateUser}
                submitLabel="Create User"
                cancelLabel="Cancel"
                isPasswordRequired
            />

            <UserFormModal
                isOpen={showEditModal}
                title="Edit User"
                formData={formData}
                parkZones={parkZones}
                zones={zones}
                error={error}
                actorType={user?.type}
                onClose={() => setShowEditModal(false)}
                onChange={handleFormChange}
                onSubmit={handleUpdateUser}
                submitLabel="Update User"
                cancelLabel="Cancel"
                isPasswordRequired={false}
            />

            <DeleteModal
                value={selectedUser?.name}
                showModal={showDeactivateModal}
                setShowModal={setShowDeactivateModal}
                onDeleteConfirm={handleDeactivateUser}
                title={t('admin.deactivateUser')}
                confirmLabel={t('admin.deactivateUser')}
                message={
                    <>
                        {t('admin.deactivateUserConfirm')}{' '}
                        <span className='text-warning fw-bolder'>{selectedUser?.name}</span>?
                        {' '}{t('admin.deactivateUserHint')}
                    </>
                }
            />
        </div>
    );
};

export default UserManagement;
